export interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(): Promise<Response> {
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(controller: ScheduledController, _env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`);
  },
} satisfies ExportedHandler<Env>;
