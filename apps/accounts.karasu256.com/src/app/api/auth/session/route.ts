import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { SESSION_COOKIE_NAME } from '@Hashibutogarasu/utils/constants';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getDb, users } from '@Hashibutogarasu/db';
import { auth } from '@/lib/auth/server';
import { buildSetCookieOptions, SESSION_DURATION_MS } from '@/lib/session';
import { syncFirebaseUserToNeonAuth } from '@/lib/neon-auth-bridge';
import { forwardSetCookies } from '@/lib/auth/forward-set-cookies';

/**
 * Creates a Firebase session cookie from a client-supplied ID token and stores
 * it as an `httpOnly` cookie, optionally scoped to `BASE_DOMAIN` for
 * cross-subdomain sharing.
 *
 * Every app now verifies "who is logged in" solely via better-auth's own
 * session, so a Firebase-only login must also mint one; this reuses the
 * firebase-session-bridge plugin's own endpoint rather than duplicating its
 * user/session synthesis logic here.
 *
 * POST /api/auth/session
 * Body: { idToken: string }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { idToken?: string };
  if (!body.idToken) {
    return NextResponse.json({ error: 'idToken required' }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(body.idToken);
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const store = await cookies();
    store.set(buildSetCookieOptions(sessionCookie));

    try {
      const db = getDb();
      await db
        .insert(users)
        .values({ id: decoded.uid })
        .onConflictDoUpdate({ target: users.id, set: { updatedAt: sql`now()` } });

      await syncFirebaseUserToNeonAuth(decoded);
    } catch {}

    const response = NextResponse.json({ ok: true });

    try {
      const bridgeHeaders = new Headers(request.headers);
      bridgeHeaders.set('cookie', `${request.headers.get('cookie') ?? ''}; ${SESSION_COOKIE_NAME}=${sessionCookie}`);
      const bridgeResponse = await auth.api.firebaseBridge({ headers: bridgeHeaders, asResponse: true });
      forwardSetCookies(bridgeResponse, response);
    } catch {}

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
