import { getDb } from "@Hashibutogarasu/db";
import { users } from "@Hashibutogarasu/db/schema";
import { eq } from "drizzle-orm";

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
      set: { updatedAt: new Date() },
    })
    .returning();
  return user;
}

/**
 * Fetches an existing user row by Firebase UID, or null if not found.
 */
export async function getUser(uid: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  return user ?? null;
}
