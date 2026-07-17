import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { env as cfEnv } from 'cloudflare:workers';
import { jobRoutes } from './routes/jobs';
import { triggerCleanupAnonymousQr } from './jobs/cleanup-anonymous-qr';

export interface Env {
  DATABASE_URL: string;
  /** Base URL of qr.karasu256.com, whose own cleanup endpoint this worker triggers. */
  QR_APP_URL: string;
  /** Shared secret proving this worker's identity to qr.karasu256.com's cron-triggered routes. */
  CRON_JOBS_API_KEY: string;
}

const env = cfEnv as Env;

const app = new Elysia({ adapter: CloudflareAdapter }).use(jobRoutes(env)).compile();

export default {
  fetch: (request, workerEnv, ctx) => app.fetch(request, workerEnv, ctx),

  async scheduled(controller: ScheduledController, workerEnv: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`);
    ctx.waitUntil(triggerCleanupAnonymousQr(workerEnv));
  },
} satisfies ExportedHandler<Env>;
