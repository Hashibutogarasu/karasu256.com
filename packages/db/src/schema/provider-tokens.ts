import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { providerAccounts } from "./provider-accounts";

export const providerTokens = pgTable(
  "provider_tokens",
  {
  id: uuid("id").primaryKey().defaultRandom(),
  providerAccountId: uuid("provider_account_id")
    .notNull()
    .references(() => providerAccounts.id, { onDelete: "cascade" }),
  /** AES-256-GCM encrypted access token. Format: "<iv_b64url>.<ciphertext_b64url>". */
  accessToken: text("access_token").notNull(),
  /** AES-256-GCM encrypted refresh token. Null when the provider does not issue one. */
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  tokenType: varchar("token_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("provider_tokens_account_idx").on(t.providerAccountId)],
);

export type ProviderToken = typeof providerTokens.$inferSelect;
export type NewProviderToken = typeof providerTokens.$inferInsert;
