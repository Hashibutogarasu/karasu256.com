import { ApiError } from '@Hashibutogarasu/utils/client';

export interface AccountSummary {
  uid: string;
  sessionToken: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  addedAt: string;
  expired: boolean;
}

export interface ListAccountsResult {
  activeUid: string | null;
  accounts: AccountSummary[];
}

function accountsUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_ACCOUNTS_URL}/api/auth/accounts${path}`;
}

/**
 * Lists the accounts bridged into `multiSession` on this device, by proxying
 * to accounts.karasu256.com — the only app with a better-auth instance.
 * `credentials: 'include'` carries the shared `.BASE_DOMAIN`-scoped Firebase
 * session cookie cross-subdomain, the same mechanism the better-auth client's
 * cross-origin `baseURL` already relies on.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listAccounts(): Promise<ListAccountsResult> {
  const res = await fetch(accountsUrl(''), { credentials: 'include' });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<ListAccountsResult>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function switchAccount(sessionToken: string): Promise<{ ok: true; uid: string }> {
  const res = await fetch(accountsUrl('/switch'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<{ ok: true; uid: string }>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function removeAccount(sessionToken: string): Promise<{ ok: true }> {
  const res = await fetch(accountsUrl('/remove'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<{ ok: true }>;
}
