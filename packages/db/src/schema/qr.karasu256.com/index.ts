/**
 * Schema entry point for `qr.karasu256.com`'s drizzle-kit migrations: just
 * the `qr_generations` table this app owns. Kept separate from the full
 * `schema/index.ts` barrel so this app's migration history never picks up
 * tables owned by other apps.
 */
export { qrGenerations, type QrGeneration, type NewQrGeneration } from '../qr-generations';
