import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { getDb, sessions } from '@Hashibutogarasu/db';
import { auth } from '@/lib/auth/server';
import { getSessionUser } from '@/lib/session-user';
import { getAdminAuth } from '@/lib/firebase-admin';
import { handlePreflight, withCors } from '@/lib/auth/cors';

export interface AccountSummary {
  uid: string;
  sessionToken: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  addedAt: string;
  expired: boolean;
}

interface FirebaseProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Bulk-fetches the live Firebase Auth profile for each uid, so the account
 * switcher reflects the same source of truth as the rest of the app instead
 * of better-auth's `users` row (a bridging record that isn't kept in sync
 * with Firebase profile edits — see `firebase-bridge-plugin.ts`).
 */
async function getFirebaseUsersByUid(uids: string[]): Promise<Map<string, FirebaseProfile>> {
  if (uids.length === 0) return new Map();
  const { users } = await getAdminAuth().getUsers(uids.map((uid) => ({ uid })));
  return new Map(
    users.map((user) => [user.uid, { displayName: user.displayName ?? null, email: user.email ?? null, photoURL: user.photoURL ?? null }])
  );
}

/**
 * Lists every account bridged into better-auth's `multiSession` device
 * session list, cross-referenced with the encrypted Firebase session cookie
 * stored on each bridged session row.
 *
 * `activeUid` is `getSessionUser()`'s id — the better-auth session behind
 * the live session cookie (the real source of truth for "who is logged in").
 *
 * GET /api/auth/accounts
 */
async function handleGET(request: NextRequest) {
  const deviceSessions = await auth.api.listDeviceSessions({ headers: request.headers });

  const tokens = deviceSessions.map((entry) => entry.session.token);
  const rows = tokens.length
    ? await getDb()
        .select({
          token: sessions.token,
          firebaseSessionCookieEnc: sessions.firebaseSessionCookieEnc,
          firebaseCookieExpiresAt: sessions.firebaseCookieExpiresAt,
          createdAt: sessions.createdAt,
        })
        .from(sessions)
        .where(inArray(sessions.token, tokens))
    : [];
  const rowsByToken = new Map(rows.map((row) => [row.token, row]));

  const bridgedEntries = deviceSessions.filter((entry) => rowsByToken.get(entry.session.token)?.firebaseSessionCookieEnc);
  const firebaseUsersByUid = await getFirebaseUsersByUid(bridgedEntries.map((entry) => entry.user.id));

  const now = Date.now();
  const accounts: AccountSummary[] = bridgedEntries.map((entry) => {
    const row = rowsByToken.get(entry.session.token)!;
    const firebaseUser = firebaseUsersByUid.get(entry.user.id);
    return {
      uid: entry.user.id,
      sessionToken: entry.session.token,
      displayName: firebaseUser?.displayName ?? entry.user.name ?? null,
      email: firebaseUser?.email ?? entry.user.email ?? null,
      photoURL: firebaseUser?.photoURL ?? entry.user.image ?? null,
      addedAt: row.createdAt.toISOString(),
      expired: !row.firebaseCookieExpiresAt || row.firebaseCookieExpiresAt.getTime() < now,
    };
  });

  const activeUser = await getSessionUser();
  return NextResponse.json({ activeUid: activeUser?.id ?? null, accounts });
}

export const GET = withCors(handleGET);
export const OPTIONS = handlePreflight;
