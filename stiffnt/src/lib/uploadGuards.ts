import "server-only";
import type { PhotoType } from "./photoStore";

/** The real file type from its first bytes (not the name or the declared type). Only PNG and JPEG. */
export function sniffImageType(bytes: Uint8Array): PhotoType | null {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((byte, index) => bytes[index] === byte)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

/**
 * Uploads per visitor per hour, counted in this server instance's memory (best effort: Vercel may run several
 * instances, and a new one starts at zero). Keeps only what the limit needs: a hashed IP and its upload times,
 * dropped after an hour. Nothing is written to logs.
 */
const windows = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("base64url").slice(0, 22);
}

export async function takeUploadSlot(ip: string, limit: number, now = Date.now()) {
  const key = await hash(ip);
  const recent = (windows.get(key) ?? []).filter((time) => now - time < HOUR);
  // Forget visitors with nothing recent, so the map doesn't grow.
  for (const [other, times] of windows) {
    if (times.every((time) => now - time >= HOUR)) windows.delete(other);
  }
  if (recent.length >= limit) {
    windows.set(key, recent);
    const retryAfterSeconds = Math.ceil((HOUR - (now - recent[0])) / 1000);
    return { allowed: false as const, retryAfterSeconds };
  }
  recent.push(now);
  windows.set(key, recent);
  return { allowed: true as const };
}

/** The visitor's IP as Vercel passes it (first address in x-forwarded-for). */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
