import { eq } from 'drizzle-orm';
import { getDb } from './client';
import { users, type User } from './schema';

/**
 * Fetches an existing user row by Firebase UID, or null if not found.
 */
export async function getUser(uid: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  return user ?? null;
}
