import { sql } from "drizzle-orm";
import { bigint, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const oauthClients = pgTable("oauth_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  iconUrl: varchar("icon_url", { length: 2048 }),
  /** One or more redirect URIs the client is allowed to use. */
  callbackUris: text("callback_uris").array().notNull(),
  secretHash: varchar("secret_hash", { length: 255 }).notNull(),
  /** Bitmask of granted permissions. Computed as readMask | writeMask for each allowed section. */
  permissions: bigint("permissions", { mode: "bigint" }).default(sql`0`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OAuthClient = typeof oauthClients.$inferSelect;
export type NewOAuthClient = typeof oauthClients.$inferInsert;
