import { and, eq } from 'drizzle-orm';
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

export interface ProviderAccountTokens {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
}

/**
 * Returns the (possibly encrypted, per `account.encryptOAuthTokens`) OAuth
 * tokens stored for the given Firebase UID's linked provider, or `null` when
 * that provider isn't linked. better-auth's `account` table only stores
 * tokens, not a denormalized profile, so a fresh name/email/avatar must be
 * derived from these by replaying them through the provider's own
 * `getUserInfo`.
 */
export async function getProviderAccountTokens(uid: string, providerId: string): Promise<ProviderAccountTokens | null> {
  const db = getDb();
  const [row] = await db
    .select({ accessToken: accounts.accessToken, refreshToken: accounts.refreshToken, idToken: accounts.idToken })
    .from(accounts)
    .where(and(eq(accounts.userId, uid), eq(accounts.providerId, providerId)));
  return row ?? null;
}
