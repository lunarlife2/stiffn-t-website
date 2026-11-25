import { site } from "@/config/site";
import { lifetimeMs, newPhotoId, savePhoto } from "@/lib/photoStore";
import { clientIp, sniffImageType, takeUploadSlot } from "@/lib/uploadGuards";

/**
 * POST /api/photo — the "Get it on my phone" upload. The body is the picture itself (PNG or JPEG).
 * Checks, in order: rate limit (per IP per hour), size (site.photobooth.maxUploadMB), real file type from its bytes.
 * Answers { id, path, expiresAt }. Photo bytes and IPs are never logged.
 */
export async function POST(request: Request) {
  const slot = await takeUploadSlot(clientIp(request.headers), site.photobooth.uploadsPerHour);
  if (!slot.allowed) {
    return Response.json(
      { error: "too_many", message: "That's a lot of photos! Please try again in a little while." },
      { status: 429, headers: { "Retry-After": String(slot.retryAfterSeconds) } },
    );
  }

  const maxBytes = site.photobooth.maxUploadMB * 1024 * 1024;
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return tooBig(maxBytes);

  // Read the body, stopping as soon as it's over the limit (content-length can be missing or wrong).
  const reader = request.body?.getReader();
  if (!reader) return badType();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return tooBig(maxBytes);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const type = sniffImageType(bytes);
  if (!type) return badType();

  const id = newPhotoId();
  try {
    const uploadedAt = await savePhoto(id, bytes, type);
    return Response.json(
      { id, path: `/p/${id}`, expiresAt: new Date(uploadedAt.getTime() + lifetimeMs()).toISOString() },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "storage", message: "We couldn't save your photo right now. Please try again." },
      { status: 503 },
    );
  }
}

function tooBig(maxBytes: number) {
  return Response.json(
    { error: "too_big", message: `That photo is too big. The limit is ${maxBytes / 1024 / 1024} MB.` },
    { status: 413 },
  );
}

function badType() {
  return Response.json(
    { error: "bad_type", message: "Only PNG or JPEG pictures can be uploaded." },
    { status: 415 },
  );
}
