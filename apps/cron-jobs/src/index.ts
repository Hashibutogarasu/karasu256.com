import { getGoogleAccessToken } from "./lib/google-auth";
import { queryExpiredPasswordResets, deleteDocument } from "./lib/firestore";

export interface Env {
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;
}

export default {
  async fetch(): Promise<Response> {
    return new Response("Not Found", { status: 404 });
  },

  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`);

    const accessToken = await getGoogleAccessToken(
      env.FIREBASE_ADMIN_CLIENT_EMAIL,
      env.FIREBASE_ADMIN_PRIVATE_KEY,
    );

    const expired = await queryExpiredPasswordResets(env.FIREBASE_ADMIN_PROJECT_ID, accessToken);
    console.log(`Found ${expired.length} expired password-reset token(s).`);

    if (expired.length === 0) return;

    const results = await Promise.allSettled(
      expired.map((name) => deleteDocument(name, accessToken)),
    );

    const deleted = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    failed.forEach((r) => console.error("Delete failed:", r.reason));

    console.log(`Cleanup complete: ${deleted} deleted, ${failed.length} failed.`);
  },
} satisfies ExportedHandler<Env>;
