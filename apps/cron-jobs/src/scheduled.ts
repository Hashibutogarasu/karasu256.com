import { triggerCleanupAnonymousQr } from './jobs/cleanup-anonymous-qr';

/** Cloudflare Cron Trigger entry point: dispatches every registered scheduled job. */
export async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
  console.log(`Cron triggered: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`);
  ctx.waitUntil(triggerCleanupAnonymousQr(env));
}
