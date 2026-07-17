import type { Env } from '../index';

/**
 * Triggers qr.karasu256.com's own cleanup of stale anonymous QR uploads.
 * This worker has no database connection scoped to qr.karasu256.com's own
 * database, so the actual `qr_generations` query and R2 delete happen
 * there, authenticated with the shared `CRON_JOBS_API_KEY` secret rather
 * than a user session.
 */
export async function triggerCleanupAnonymousQr(env: Env): Promise<void> {
  const res = await fetch(`${env.QR_APP_URL}/api/cron/cleanup-anonymous`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CRON_JOBS_API_KEY}` },
  });
  if (!res.ok) console.error(`cleanup-anonymous-qr failed: ${res.status}`);
}
