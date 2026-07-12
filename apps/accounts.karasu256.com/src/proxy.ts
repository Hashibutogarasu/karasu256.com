import { type NextRequest, NextResponse } from 'next/server';
import { SECURE_COOKIE_PREFIX } from 'better-auth/cookies';
import { BETTER_AUTH_SESSION_COOKIE_NAME } from '@Hashibutogarasu/utils/constants';
import { firebaseConfigSchema } from '@/lib/firebase/schema';

/**
 * Next.js 16 proxy (formerly middleware) that:
 * 1. Validates all required Firebase environment variables on every request.
 * 2. Redirects unauthenticated requests away from /settings.
 * 3. Redirects authenticated requests away from the sign-in root (/).
 *
 * A request counts as authenticated if the better-auth session cookie is
 * present. Checked directly by name rather than via better-auth/cookies'
 * `getSessionCookie()` helper: that helper only knows how to look up
 * `<prefix>.session_token`-style names, but this app overrides
 * `advanced.cookies.session_token.name` to a flat custom name
 * (`BETTER_AUTH_SESSION_COOKIE_NAME`) with no such prefix — `getSessionCookie()`
 * can't be configured to match it, so it always returns null here.
 *
 * Cookie verification (signature + expiry) is intentionally skipped here because
 * the Firebase Admin SDK is not Edge-runtime compatible. Full verification is
 * performed inside each protected API route and server component as needed.
 */
export function proxy(request: NextRequest): NextResponse {
  const configResult = firebaseConfigSchema.safeParse({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });

  if (!configResult.success) {
    return new NextResponse(JSON.stringify({ error: 'Firebase configuration is invalid', issues: configResult.error.issues }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { pathname } = request.nextUrl;
  const hasSession =
    Boolean(request.cookies.get(`${SECURE_COOKIE_PREFIX}${BETTER_AUTH_SESSION_COOKIE_NAME}`)?.value) ||
    Boolean(request.cookies.get(BETTER_AUTH_SESSION_COOKIE_NAME)?.value);

  if (hasSession && pathname === '/') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  if (!hasSession && pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/** Apply this middleware to all non-static routes. */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
