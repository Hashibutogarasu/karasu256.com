import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, sessions } from '@Hashibutogarasu/db';
import { auth } from '@/lib/auth/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { buildSetCookieOptions } from '@/lib/session';
import { decryptFirebaseCookie } from '@/lib/auth/firebase-cookie-crypto';
import { handlePreflight, withCors } from '@/lib/auth/cors';
import { forwardSetCookies } from '@/lib/auth/forward-set-cookies';

const bodySchema = z.object({ sessionToken: z.string().min(1) });

/**
 * Switches the active account on this device: restores the target session's
 * stored Firebase cookie as the live `SESSION_COOKIE_NAME` cookie (the real
 * source of truth read by `getSessionUser()` everywhere), and flips
 * better-auth's own active `multiSession` session to match.
 *
 * Also mints a Firebase custom token for the target uid via the Admin SDK
 * (no password needed). accounts.karasu256.com's settings pages gate their
 * client-rendered UI on the *browser's own* Firebase Auth instance
 * (`onAuthStateChanged`), which is independent of this server cookie — the
 * client must call `signInWithCustomToken` with this token so that live UI
 * reflects the switch too, not just server-rendered pages that re-read the
 * cookie per request.
 *
 * POST /api/auth/accounts/switch
 * Body: { sessionToken: string }
 */
async function handlePOST(request: NextRequest) {
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'sessionToken required' }, { status: 400 });
  }
  const { sessionToken } = parsedBody.data;

  const deviceSessions = await auth.api.listDeviceSessions({ headers: request.headers });
  const target = deviceSessions.find((entry) => entry.session.token === sessionToken);
  if (!target) {
    return NextResponse.json({ error: 'Unknown session' }, { status: 403 });
  }

  const [row] = await getDb()
    .select({
      firebaseSessionCookieEnc: sessions.firebaseSessionCookieEnc,
      firebaseCookieExpiresAt: sessions.firebaseCookieExpiresAt,
    })
    .from(sessions)
    .where(eq(sessions.token, sessionToken));

  if (!row?.firebaseSessionCookieEnc || !row.firebaseCookieExpiresAt || row.firebaseCookieExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'reauth_required', uid: target.user.id }, { status: 409 });
  }

  const decrypted = decryptFirebaseCookie(row.firebaseSessionCookieEnc);
  const store = await cookies();
  store.set(buildSetCookieOptions(decrypted));

  const setActiveResponse = await auth.api.setActiveSession({
    headers: request.headers,
    body: { sessionToken },
    asResponse: true,
  });
  const customToken = await getAdminAuth().createCustomToken(target.user.id);

  const response = NextResponse.json({ ok: true, uid: target.user.id, customToken });
  forwardSetCookies(setActiveResponse, response);
  return response;
}

export const POST = withCors(handlePOST);
export const OPTIONS = handlePreflight;
