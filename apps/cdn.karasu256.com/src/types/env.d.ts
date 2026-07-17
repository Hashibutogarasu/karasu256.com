export {};

declare global {
  interface Env {
    /**
     * Symmetric secret this worker uses to sign and verify short-lived
     * upload tickets (see `lib/upload-ticket.ts`). Provision with
     * `wrangler secret put UPLOAD_TICKET_SECRET` (and again with
     * `--env dev`) — not committed anywhere, unlike the plain `[vars]` in
     * `wrangler.toml`.
     */
    UPLOAD_TICKET_SECRET: string;
  }
}
