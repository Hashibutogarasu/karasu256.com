import { bigint, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { oauthClients } from './oauth-clients';
import { users } from './users';

export const oauthAccessTokens = pgTable('oauth_access_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** SHA-256 digest of the raw access token. */
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  /** First 12 characters of the raw token for display (e.g. "tok_XXXXXXXX"). */
  tokenPrefix: varchar('token_prefix', { length: 12 }).notNull(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => oauthClients.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** Bitmask of permissions granted to this token. */
  permissions: bigint('permissions', { mode: 'bigint' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  /** Set when the token is explicitly revoked. Null means the token is still valid. */
  revokedAt: timestamp('revoked_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type OAuthAccessToken = typeof oauthAccessTokens.$inferSelect;
export type NewOAuthAccessToken = typeof oauthAccessTokens.$inferInsert;
