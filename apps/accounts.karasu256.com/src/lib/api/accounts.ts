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

/**
 * Lists the accounts bridged into `multiSession` on this device.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listAccounts(): Promise<ListAccountsResult> {
  const res = await fetch('/api/auth/accounts');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<ListAccountsResult>;
}

/**
 * Bridges an additional Firebase account (already signed in via the
 * secondary Firebase Auth instance) into this device's account list.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function addAccount(idToken: string): Promise<{ ok: true; uid: string; sessionToken: string }> {
  const res = await fetch('/api/auth/accounts/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<{ ok: true; uid: string; sessionToken: string }>;
}

/**
 * `customToken` lets the caller sync the browser's own primary Firebase Auth
 * instance to the switched-to account via `signInWithCustomToken` — the
 * settings pages here gate their client-rendered UI on that instance's
 * `onAuthStateChanged`, which this server-side cookie swap alone doesn't update.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function switchAccount(sessionToken: string): Promise<{ ok: true; uid: string; customToken: string }> {
  const res = await fetch('/api/auth/accounts/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<{ ok: true; uid: string; customToken: string }>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function removeAccount(sessionToken: string): Promise<{ ok: true }> {
  const res = await fetch('/api/auth/accounts/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<{ ok: true }>;
}
