import { bigint, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { oauthClients } from "./oauth-clients";
import { users } from "./users";

export const oauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** SHA-256 digest of the raw authorization code. */
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => oauthClients.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** The redirect_uri that was present when the code was issued. Must match on exchange. */
  redirectUri: varchar("redirect_uri", { length: 2048 }).notNull(),
  /** Bitmask of permissions the user consented to. */
  permissions: bigint("permissions", { mode: "bigint" }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  /** Set when the code is exchanged for a token; prevents replay. */
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferSelect;
export type NewOAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferInsert;
