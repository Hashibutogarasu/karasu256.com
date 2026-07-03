import { lt } from 'drizzle-orm';
import { createDb, passwordResetTokens } from '@Hashibutogarasu/db';

export interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(): Promise<Response> {
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`);

    const db = createDb(env.DATABASE_URL);
    const result = await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()))
      .returning({ id: passwordResetTokens.id });

    console.log(`Cleanup complete: ${result.length} expired password-reset token(s) deleted.`);
  },
} satisfies ExportedHandler<Env>;
