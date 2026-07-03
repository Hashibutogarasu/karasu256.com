import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  iconUrl: varchar('icon_url', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
