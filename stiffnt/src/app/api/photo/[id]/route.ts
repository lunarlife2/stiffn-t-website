import { isExpired, readPhoto } from "@/lib/photoStore";

/**
 * GET /api/photo/<id> — the picture itself, served through the site (the Blob store is private), only while it's
 * younger than the lifetime. ?download=1 makes browsers save it instead of showing it.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/photo/[id]">) {
  const { id } = await params;
  const photo = await readPhoto(id);
  if (!photo || isExpired(photo.uploadedAt)) {
    if (photo?.body instanceof ReadableStream) await photo.body.cancel();
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const download = new URL(request.url).searchParams.has("download");
  const name = `stiffnt-photobooth.${photo.type === "image/png" ? "png" : "jpg"}`;
  return new Response(photo.body as BodyInit, {
    headers: {
      "Content-Type": photo.type,
      "Content-Length": String(photo.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      // Private: browsers may keep it briefly, shared caches never.
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
