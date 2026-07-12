import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, sessions } from '@Hashibutogarasu/db';
import { getAdminAuth } from '@/lib/firebase-admin';
import { testAuth } from '@/lib/auth/server.test';
import { encryptFirebaseCookie } from '@/lib/auth/firebase-cookie-crypto';
import { buildSetCookieOptions, SESSION_DURATION_MS } from '@/lib/session';
import { SESSION_COOKIE_NAME } from '@Hashibutogarasu/utils/constants';

const postBodySchema = z.object({ label: z.string().min(1) });
const deleteBodySchema = z.object({ uid: z.string().min(1) });

/**
 * Test-only endpoint for the Playwright E2E suite (`e2e/multi-account.spec.ts`).
 * Never reachable in production — guarded by `NODE_ENV` rather than a
 * dedicated env flag, so there is no extra variable to configure or forget.
 */
function guardTestMode(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return null;
}

async function mintFirebaseTokens(uid: string): Promise<{ idToken: string; refreshToken: string }> {
  const customToken = await getAdminAuth().createCustomToken(uid);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  if (!res.ok) {
    throw new Error(`Failed to exchange Firebase custom token: ${res.status}`);
  }
  const { idToken, refreshToken } = (await res.json()) as { idToken: string; refreshToken: string };
  return { idToken, refreshToken };
}

/**
 * Creates a real Firebase test user and signs it in — both as a real Firebase
 * session cookie (via a custom-token exchange, since the Admin SDK alone
 * cannot mint an ID token) and as a bridged better-auth `multiSession` device
 * session (via the test-only `testAuth` instance's `ctx.test.login`, per
 * better-auth's `testUtils` plugin). Returns every cookie needed for
 * Playwright's `context.addCookies()` to start a test already signed in, an
 * `idToken` the test can feed into the real `/api/auth/accounts/add`
 * endpoint, and an `idToken`/`refreshToken` pair the E2E spec uses to mock
 * the Firebase Auth REST response for email/password sign-in — this lets the
 * test drive the app's real sign-in form UI without depending on whichever
 * providers happen to be enabled for the Firebase project behind this
 * environment.
 *
 * POST /api/test/accounts
 * Body: { label: string }
 */
export async function POST(request: NextRequest) {
  const guard = guardTestMode();
  if (guard) return guard;

  const parsed = postBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'label required' }, { status: 400 });
  }

  const email = `e2e-${parsed.data.label}-${Date.now()}@example.test`;
  const password = crypto.randomUUID();
  const firebaseUser = await getAdminAuth().createUser({ email, emailVerified: true, password });
  const uid = firebaseUser.uid;

  const { idToken, refreshToken } = await mintFirebaseTokens(uid);
  const firebaseSessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });

  const ctx = await testAuth.$context;
  const testUser = ctx.test.createUser({ id: uid, email, name: email });
  await ctx.test.saveUser(testUser);
  const { token, cookies } = await ctx.test.login({ userId: uid });

  await getDb()
    .update(sessions)
    .set({
      firebaseSessionCookieEnc: encryptFirebaseCookie(firebaseSessionCookie),
      firebaseCookieExpiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    })
    .where(eq(sessions.token, token));

  const firebaseCookieOptions = buildSetCookieOptions(firebaseSessionCookie);

  return NextResponse.json({
    uid,
    email,
    password,
    idToken,
    refreshToken,
    sessionToken: token,
    cookies: [
      ...cookies,
      {
        name: SESSION_COOKIE_NAME,
        value: firebaseSessionCookie,
        domain: firebaseCookieOptions.domain ?? 'localhost',
        path: firebaseCookieOptions.path,
        httpOnly: firebaseCookieOptions.httpOnly,
        secure: firebaseCookieOptions.secure,
        sameSite: 'Lax',
        expires: Math.floor((Date.now() + SESSION_DURATION_MS) / 1000),
      },
    ],
  });
}

/**
 * Deletes a test account created via `POST`, from both Firebase and the
 * better-auth `users`/`session` rows (which cascade-delete via the schema's
 * `onDelete: 'cascade'` foreign key).
 *
 * DELETE /api/test/accounts
 * Body: { uid: string }
 */
export async function DELETE(request: NextRequest) {
  const guard = guardTestMode();
  if (guard) return guard;

  const parsed = deleteBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'uid required' }, { status: 400 });
  }

  const ctx = await testAuth.$context;
  await ctx.test.deleteUser(parsed.data.uid);
  await getAdminAuth()
    .deleteUser(parsed.data.uid)
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
