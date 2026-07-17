import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * One row per generated/uploaded QR code image, for tracing R2 storage back
 * to who (if anyone) generated it. `userId` is null for anonymous
 * generations; `onDelete: 'set null'` keeps the audit row (anonymized)
 * rather than dropping it when the owning user is deleted.
 */
export const qrGenerations = pgTable('qr_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: varchar('file_name', { length: 512 }).notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type QrGeneration = typeof qrGenerations.$inferSelect;
export type NewQrGeneration = typeof qrGenerations.$inferInsert;
