export {};

declare global {
  interface Env {
    DATABASE_URL: string;
    /** Base URL of qr.karasu256.com, whose own cleanup endpoint this worker triggers. */
    QR_APP_URL: string;
    /** Shared secret proving this worker's identity to qr.karasu256.com's cron-triggered routes. */
    CRON_JOBS_API_KEY: string;
  }
}
