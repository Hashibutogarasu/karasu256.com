export {};

declare global {
  interface Env {
    /**
     * Symmetric secret this worker uses to sign and verify short-lived
     * upload tickets (see `lib/upload-ticket.ts`). Provision with
     * `wrangler secret put UPLOAD_TICKET_SECRET --env production` (and
     * again with `--env dev`) — not committed anywhere, unlike the plain
     * `[vars]` in `wrangler.toml`.
     */
    UPLOAD_TICKET_SECRET: string;
    /**
     * Shared secret identifying the `cron-jobs` worker as a trusted caller
     * (see `lib/auth.ts`'s `verifyCronJobsKey`), for its scheduled cleanup
     * of anonymous QR uploads — a service identity, not a user session, so
     * it can't go through `verifyAccountsJwt`/`requireUid`. Must match the
     * `CRON_JOBS_API_KEY` provisioned on the `cron-jobs` worker. Provision
     * with `wrangler secret put CRON_JOBS_API_KEY --env production` (and
     * again with `--env dev`).
     */
    CRON_JOBS_API_KEY: string;
    /**
     * `x-vercel-protection-bypass` value for reaching a Vercel deployment
     * that has Deployment Protection enabled (e.g. a protected Preview) —
     * unset in environments where the target isn't protected (e.g.
     * production). See `lib/auth.ts`'s `vercelProtectionBypassHeaders`.
     * Provision with `wrangler secret put VERCEL_PROTECTION_BYPASS_SECRET
     * --env <env>` for whichever environment targets a protected
     * deployment.
     */
    VERCEL_PROTECTION_BYPASS_SECRET?: string;
  }
}
