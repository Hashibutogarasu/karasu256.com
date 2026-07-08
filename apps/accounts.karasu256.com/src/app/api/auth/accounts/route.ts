import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { getDb, sessions } from '@Hashibutogarasu/db';
import { auth } from '@/lib/auth/server';
import { getSessionUser } from '@/lib/session-user';
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

/**
 * Lists every account bridged into better-auth's `multiSession` device
 * session list, cross-referenced with the encrypted Firebase session cookie
 * stored on each bridged session row.
 *
 * `activeUid` is computed from the live Firebase `SESSION_COOKIE_NAME`
 * cookie (the real source of truth for "who is logged in"), not from
 * better-auth's own active-session pointer — the two can drift (see
 * `firebase-bridge-plugin.ts`'s docstring), so trusting Firebase's cookie
 * here avoids surfacing that drift to the UI.
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

  const now = Date.now();
  const accounts: AccountSummary[] = deviceSessions
    .filter((entry) => rowsByToken.get(entry.session.token)?.firebaseSessionCookieEnc)
    .map((entry) => {
      const row = rowsByToken.get(entry.session.token)!;
      return {
        uid: entry.user.id,
        sessionToken: entry.session.token,
        displayName: entry.user.name ?? null,
        email: entry.user.email ?? null,
        photoURL: entry.user.image ?? null,
        addedAt: row.createdAt.toISOString(),
        expired: !row.firebaseCookieExpiresAt || row.firebaseCookieExpiresAt.getTime() < now,
      };
    });

  const activeUser = await getSessionUser();
  return NextResponse.json({ activeUid: activeUser?.uid ?? null, accounts });
}

export const GET = withCors(handleGET);
export const OPTIONS = handlePreflight;
