import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

/** better-auth's `session` model. New table; NextAuth used stateless JWTs before this. */
export const sessions = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** AES-256-GCM ciphertext of the Firebase session cookie bridged to this session, for multi-account switching. */
    firebaseSessionCookieEnc: text('firebase_session_cookie_enc'),
    /** Mirrors the bridged Firebase session cookie's own expiry, for multi-account switching. */
    firebaseCookieExpiresAt: timestamp('firebase_cookie_expires_at'),
  },
  (t) => [index('session_userId_idx').on(t.userId)]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
