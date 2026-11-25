import { deleteExpiredPhotos } from "@/lib/photoStore";

/**
 * GET /api/cron/cleanup — run by Vercel Cron (vercel.json). Deletes every photo older than
 * site.photobooth.photoLifetimeHours. Vercel sends `Authorization: Bearer <CRON_SECRET>`; anything else is refused.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const deleted = await deleteExpiredPhotos();
  return Response.json({ deleted }, { headers: { "Cache-Control": "no-store" } });
}
