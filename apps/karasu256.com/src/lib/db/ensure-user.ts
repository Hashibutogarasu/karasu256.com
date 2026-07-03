import { getDb } from '@Hashibutogarasu/db';
import { users } from '@Hashibutogarasu/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Upserts a user row by Firebase UID and returns the persisted record.
 * Creates the row on first sign-in; updates `updated_at` on subsequent calls.
 */
export async function ensureUser(uid: string, name?: string | null) {
  const db = getDb();
  const [user] = await db
    .insert(users)
    .values({ id: uid, name: name ?? null })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: sql`COALESCE(${users.name}, EXCLUDED.name)`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}
