import { Elysia } from 'elysia';
import type { Env } from '../index';
import { triggerCleanupAnonymousQr } from '../jobs/cleanup-anonymous-qr';

/** Manual-trigger routes mirroring the scheduled jobs, for testing/ops use outside the cron schedule. */
export const jobRoutes = (env: Env) =>
  new Elysia().post('/jobs/cleanup-anonymous-qr', async () => {
    await triggerCleanupAnonymousQr(env);
    return { ok: true };
  });
