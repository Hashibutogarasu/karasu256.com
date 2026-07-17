import { NextResponse } from 'next/server';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { getDb } from '@Hashibutogarasu/db';
import { qrGenerations } from '@Hashibutogarasu/db/schema';
import { MissingEnvError, deleteUploadedImage } from '@Hashibutogarasu/utils/server';

/** Returns `NEXT_PUBLIC_IMAGE_API_URL`, throwing {@link MissingEnvError} if it's unset. */
function getImageApiUrl(): string {
  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL;
  if (!imageApiUrl) throw new MissingEnvError('NEXT_PUBLIC_IMAGE_API_URL');
  return imageApiUrl;
}

/**
 * Deletes anonymous QR uploads (`qr_generations` rows with no owning user)
 * older than `maxAgeDays`, removing both the R2 file (via
 * cdn.karasu256.com) and the history row itself. Best-effort per row: a
 * failed R2 delete leaves that row for the next run instead of aborting.
 */
async function cleanupAnonymousUploads(maxAgeDays = 30): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  const stale = await db
    .select({ id: qrGenerations.id, url: qrGenerations.url })
    .from(qrGenerations)
    .where(and(isNull(qrGenerations.userId), lt(qrGenerations.createdAt, cutoff)));

  for (const row of stale) {
    try {
      await deleteUploadedImage(row.url, { imageApiUrl: getImageApiUrl(), token: process.env.CRON_JOBS_API_KEY });
      await db.delete(qrGenerations).where(eq(qrGenerations.id, row.id));
    } catch (err) {
      console.error(`Failed to clean up anonymous QR upload ${row.id}`, err);
    }
  }
}

/**
 * Triggered by `cron-jobs`'s scheduled cleanup (see that worker's
 * `src/jobs/cleanup-anonymous-qr.ts`), authenticated with the shared
 * `CRON_JOBS_API_KEY` secret rather than a user session.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_JOBS_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await cleanupAnonymousUploads();
  return NextResponse.json({ ok: true });
}
