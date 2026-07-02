import { getDb } from "./client";
import { users, type User } from "./schema";

/**
 * Sets a user's icon URL, creating the row if it doesn't exist yet.
 * Unlike name synchronization elsewhere, this always overwrites the
 * existing value since the caller's intent is an explicit icon change.
 */
export async function updateUserIcon(uid: string, iconUrl: string | null): Promise<User> {
  const db = getDb();
  const [user] = await db
    .insert(users)
    .values({ id: uid, iconUrl })
    .onConflictDoUpdate({
      target: users.id,
      set: { iconUrl, updatedAt: new Date() },
    })
    .returning();
  return user;
}
