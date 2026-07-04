import { eq } from 'drizzle-orm';
import { getDb } from './client';
import { accounts } from './schema';

/**
 * Lists the social-provider IDs linked to the given Firebase UID via
 * better-auth's `account` table (e.g. `["google", "github"]`).
 */
export async function getLinkedProviderIds(uid: string): Promise<string[]> {
  const db = getDb();
  const rows = await db.select({ providerId: accounts.providerId }).from(accounts).where(eq(accounts.userId, uid));
  return rows.map((r) => r.providerId);
}
