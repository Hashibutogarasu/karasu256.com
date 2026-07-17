import { and, eq, isNull, lt } from 'drizzle-orm';
import { createDb } from '@Hashibutogarasu/db';
import { qrGenerations } from '@Hashibutogarasu/db/schema';

export interface Env {
  DATABASE_URL: string;
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  CDN_BASE_URL: string;
  /** Shared secret proving this worker's identity to cdn.karasu256.com's `DELETE` route (see `verifyCronJobsKey` there). */
  CRON_JOBS_API_KEY: string;
}

/**
 * Deletes anonymous QR uploads (`qr_generations` rows with no owning user)
 * older than `maxAgeDays`, removing both the R2 file, via
 * cdn.karasu256.com's `DELETE` route authenticated as a trusted service,
 * and the history row itself.
 */
async function cleanupAnonymousQrUploads(env: Env, maxAgeDays = 30): Promise<void> {
  const db = createDb(env.DATABASE_URL);
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  const stale = await db
    .select({ id: qrGenerations.id, fileName: qrGenerations.fileName })
    .from(qrGenerations)
    .where(and(isNull(qrGenerations.userId), lt(qrGenerations.createdAt, cutoff)));

  for (const row of stale) {
    const res = await fetch(`${env.CDN_BASE_URL}/${row.fileName}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.CRON_JOBS_API_KEY}` },
    });
    if (!res.ok && res.status !== 404) {
      console.error(`Failed to delete ${row.fileName}: ${res.status}`);
      continue;
    }
    await db.delete(qrGenerations).where(eq(qrGenerations.id, row.id));
  }
}

export default {
  async fetch(): Promise<Response> {
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`);
    await cleanupAnonymousQrUploads(env);
  },
} satisfies ExportedHandler<Env>;
