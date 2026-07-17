import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * One row per generated/uploaded QR code image, for tracing R2 storage back
 * to who (if anyone) generated it. `userId` is null for anonymous
 * generations. It is a soft reference to the `users` table's `id` (not a
 * database-level foreign key), since `qr.karasu256.com` uses its own
 * separate database and cannot enforce a foreign key against a table that
 * lives in a different one.
 */
export const qrGenerations = pgTable('qr_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: varchar('file_name', { length: 512 }).notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  userId: varchar('user_id', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type QrGeneration = typeof qrGenerations.$inferSelect;
export type NewQrGeneration = typeof qrGenerations.$inferInsert;
