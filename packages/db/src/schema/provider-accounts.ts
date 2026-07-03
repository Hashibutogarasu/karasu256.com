import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const providerAccounts = pgTable(
  'provider_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Lowercase provider identifier, e.g. "google" or "github". */
    provider: varchar('provider', { length: 50 }).notNull(),
    /** The user's unique ID within the provider's system. */
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    name: varchar('name', { length: 255 }),
    avatarUrl: varchar('avatar_url', { length: 2048 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('provider_accounts_provider_user_idx').on(t.provider, t.providerUserId)]
);

export type ProviderAccount = typeof providerAccounts.$inferSelect;
export type NewProviderAccount = typeof providerAccounts.$inferInsert;
