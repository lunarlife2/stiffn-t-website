import "server-only";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { customAlphabet } from "nanoid";
import { del, get, list, put } from "@vercel/blob";
import { site } from "@/config/site";

/**
 * Where "Get it on my phone" photos live.
 * - Production (and whenever BLOB_READ_WRITE_TOKEN is set): Vercel Blob, private access, under `photobooth/`.
 * - Local development without a token: a git-ignored folder `.photobooth-dev/`, so the flow can be tried offline.
 * There is no way to list photos from the site: a photo can only be opened with its id.
 */

/** 24 characters from a 62-letter alphabet (~143 bits): impossible to guess. Never a counter or a timestamp. */
const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 24;
export const newPhotoId = customAlphabet(ID_ALPHABET, ID_LENGTH);
export const isPhotoId = (id: string) => new RegExp(`^[${ID_ALPHABET}]{${ID_LENGTH}}$`).test(id);

export type PhotoType = "image/png" | "image/jpeg";
/** What was uploaded: one photo or a strip (kept in the file name, for the download name). */
export type PhotoKind = "photo" | "strip";

export const lifetimeMs = () => site.photobooth.photoLifetimeHours * 60 * 60 * 1000;
export const isExpired = (uploadedAt: Date, now = Date.now()) => now - uploadedAt.getTime() >= lifetimeMs();

/** How long until the photo is deleted, e.g. "23 h 12 min" (null if it's already expired). */
export function timeLeft(uploadedAt: Date, now = Date.now()) {
  const left = uploadedAt.getTime() + lifetimeMs() - now;
  if (left <= 0) return null;
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.max(1, Math.round((left % 3_600_000) / 60_000));
  return hours >= 1 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

const PREFIX = "photobooth/";
const extension = (type: PhotoType) => (type === "image/png" ? "png" : "jpg");

const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.NODE_ENV === "production";
const DEV_DIR = join(process.cwd(), ".photobooth-dev");

export async function savePhoto(id: string, bytes: Uint8Array, type: PhotoType, kind: PhotoKind): Promise<Date> {
  const name = `${id}-${kind}.${extension(type)}`;
  if (blobEnabled()) {
    await put(`${PREFIX}${name}`, Buffer.from(bytes), {
      access: "private",
      contentType: type,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60,
    });
    return new Date();
  }
  await mkdir(DEV_DIR, { recursive: true });
  await writeFile(join(DEV_DIR, name), bytes);
  return new Date();
}

/** The stored file's name for an id (one lookup by prefix), or null. */
async function findName(id: string): Promise<string | null> {
  if (blobEnabled()) {
    const page = await list({ prefix: `${PREFIX}${id}-`, limit: 1 }).catch(() => null);
    return page?.blobs[0]?.pathname.slice(PREFIX.length) ?? null;
  }
  const files = await readdir(DEV_DIR).catch(() => [] as string[]);
  return files.find((file) => file.startsWith(`${id}-`)) ?? null;
}

const parseName = (name: string) => {
  const match = /^[A-Za-z0-9]+-(photo|strip)\.(png|jpg)$/.exec(name);
  if (!match) return null;
  return { kind: match[1] as PhotoKind, type: (match[2] === "png" ? "image/png" : "image/jpeg") as PhotoType };
};

export type StoredPhoto = {
  type: PhotoType;
  kind: PhotoKind;
  uploadedAt: Date;
  body: ReadableStream<Uint8Array> | Uint8Array;
  size: number;
};

/** The photo with its upload time, or null if there's none. Callers check `isExpired` themselves. */
export async function readPhoto(id: string): Promise<StoredPhoto | null> {
  if (!isPhotoId(id)) return null;
  const name = await findName(id);
  const parsed = name ? parseName(name) : null;
  if (!name || !parsed) return null;
  if (blobEnabled()) {
    const result = await get(`${PREFIX}${name}`, { access: "private" }).catch(() => null);
    if (!result || result.statusCode !== 200) return null;
    return { ...parsed, uploadedAt: result.blob.uploadedAt, body: result.stream, size: result.blob.size };
  }
  const file = join(DEV_DIR, name);
  const info = await stat(file).catch(() => null);
  if (!info) return null;
  return { ...parsed, uploadedAt: info.mtime, body: new Uint8Array(await readFile(file)), size: info.size };
}

/** Only the upload time (for the /p/<id> page), without reading the picture. */
export async function photoUploadedAt(id: string): Promise<Date | null> {
  const photo = await readPhoto(id);
  if (!photo) return null;
  if (photo.body instanceof ReadableStream) await photo.body.cancel();
  return photo.uploadedAt;
}

export async function deletePhoto(id: string) {
  if (!isPhotoId(id)) return;
  const name = await findName(id);
  if (!name) return;
  if (blobEnabled()) await del(`${PREFIX}${name}`).catch(() => {});
  else await rm(join(DEV_DIR, name), { force: true });
}

/** Deletes every photo older than the lifetime. Returns how many were deleted. Used by the cron job. */
export async function deleteExpiredPhotos(now = Date.now()): Promise<number> {
  let deleted = 0;
  if (blobEnabled()) {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
      const old = page.blobs.filter((blob) => isExpired(blob.uploadedAt, now)).map((blob) => blob.url);
      if (old.length) {
        await del(old);
        deleted += old.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return deleted;
  }
  const files = await readdir(DEV_DIR).catch(() => [] as string[]);
  for (const file of files) {
    const info = await stat(join(DEV_DIR, file));
    if (isExpired(info.mtime, now)) {
      await rm(join(DEV_DIR, file), { force: true });
      deleted++;
    }
  }
  return deleted;
}
