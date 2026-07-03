import { and, eq } from 'drizzle-orm';
import { getDb } from './client';
import { providerAccounts } from './schema';

export interface ProviderAccountSummary {
  provider: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/**
 * Lists the third-party providers linked to the given Firebase UID.
 */
export async function getProviderAccounts(uid: string): Promise<ProviderAccountSummary[]> {
  const db = getDb();
  return db
    .select({
      provider: providerAccounts.provider,
      name: providerAccounts.name,
      email: providerAccounts.email,
      avatarUrl: providerAccounts.avatarUrl,
    })
    .from(providerAccounts)
    .where(eq(providerAccounts.userId, uid));
}

/**
 * Fetches a single linked provider account by Firebase UID and provider ID,
 * or null if that provider isn't linked.
 */
export async function getProviderAccount(uid: string, provider: string): Promise<ProviderAccountSummary | null> {
  const db = getDb();
  const [row] = await db
    .select({
      provider: providerAccounts.provider,
      name: providerAccounts.name,
      email: providerAccounts.email,
      avatarUrl: providerAccounts.avatarUrl,
    })
    .from(providerAccounts)
    .where(and(eq(providerAccounts.userId, uid), eq(providerAccounts.provider, provider)));
  return row ?? null;
}
