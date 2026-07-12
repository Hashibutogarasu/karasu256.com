import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/session-user';

/**
 * Mints a short-lived Firebase custom token for the user identified by the
 * still-valid `SESSION_COOKIE_NAME` cookie, so the browser can restore its
 * client-side Firebase Auth state without a full re-login.
 *
 * Client-side Firebase Auth persistence (IndexedDB) can be lost independently
 * of the server session cookie — e.g. a browser evicting site storage after a
 * cross-site redirect round trip, such as the one `authClient.linkSocial`
 * drives through a social provider and back to `/settings/linking`. In that
 * case `onAuthStateChanged` legitimately fires with no user even though the
 * server session is untouched; callers should try this endpoint before
 * treating that as a real sign-out.
 *
 * POST /api/auth/resync
 */
export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  const customToken = await getAdminAuth().createCustomToken(sessionUser.id);
  return NextResponse.json({ customToken });
}
