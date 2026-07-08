import { z } from 'zod';
import { createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { getDb, sessions } from '@Hashibutogarasu/db';
import { eq } from 'drizzle-orm';
import { encryptFirebaseCookie } from '@/lib/auth/firebase-cookie-crypto';

export const FIREBASE_BRIDGE_PATH = '/firebase-bridge';
export const FIREBASE_BRIDGE_ADD_PATH = '/firebase-bridge/add';

/** Validated subset of `DecodedIdToken` claims this plugin relies on. */
const bridgedClaimsSchema = z.object({
  uid: z.string().min(1),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
  name: z.string().optional(),
  exp: z.number(),
});

type BridgedClaims = z.infer<typeof bridgedClaimsSchema>;

/**
 * Stricter claims schema for `/firebase-bridge/add`: only email/password and
 * passkey sign-in feed this endpoint (see `secondary-auth.ts`), and both
 * always carry a real Firebase email, so `email` is required here rather
 * than falling back to a synthetic placeholder.
 */
const addAccountClaimsSchema = bridgedClaimsSchema.extend({ email: z.string().min(1) });

/**
 * Stores an encrypted copy of the Firebase session cookie (plus its expiry)
 * on a bridged better-auth session row, so a later account-switch can
 * restore it as the live `SESSION_COOKIE_NAME` cookie.
 */
async function storeFirebaseCookieOnSession(sessionId: string, firebaseSessionCookie: string, claims: BridgedClaims) {
  await getDb()
    .update(sessions)
    .set({
      firebaseSessionCookieEnc: encryptFirebaseCookie(firebaseSessionCookie),
      firebaseCookieExpiresAt: new Date(claims.exp * 1000),
    })
    .where(eq(sessions.id, sessionId));
}

/**
 * Synthesizes a real better-auth session from an already-verified Firebase
 * session cookie. Firebase remains the actual login authority; this plugin
 * only exists so `oauthProvider`'s `/oauth2/authorize` flow (which checks
 * better-auth's own session to know who's logged in) recognizes a user who
 * is already signed in via Firebase, without requiring a second login.
 *
 * Also exposes an additive `/firebase-bridge/add` endpoint used by the
 * multi-account switcher: given a Firebase session cookie for a *different*
 * account (passed in the request body, not read from the ambient cookie),
 * it bridges that account into a new better-auth session too. Both endpoints
 * call `setSessionCookie`, which is what the `multiSession` plugin's `after`
 * hook keys off of to register the session as a device session (a signed
 * `..._multi-<token>` cookie) — this is the only way to get a session tracked
 * by `multiSession`, since `multiSession` state lives entirely in per-request
 * hooks on better-auth's own endpoint pipeline, not in `internalAdapter`
 * calls made outside of it. better-auth's own primary session cookie ends up
 * pointing at whichever account was bridged most recently, but since no page
 * in this app ever reads better-auth's session for "who is logged in" (that
 * is always Firebase's `SESSION_COOKIE_NAME`), this has no user-visible
 * effect — and any OAuth-provider flow re-bridges the *current* Firebase
 * account via `bridgeFirebaseSession()` before it needs a better-auth
 * session anyway.
 */
export function firebaseSessionBridgePlugin() {
  return {
    id: 'firebase-session-bridge',
    endpoints: {
      firebaseBridge: createAuthEndpoint(FIREBASE_BRIDGE_PATH, { method: 'POST' }, async (ctx) => {
        const sessionCookie = ctx.getCookie(SESSION_COOKIE_NAME);
        if (!sessionCookie) {
          return ctx.json({ ok: false }, { status: 401 });
        }

        const parsed = bridgedClaimsSchema.safeParse(
          await getAdminAuth()
            .verifySessionCookie(sessionCookie, true)
            .catch(() => null)
        );
        if (!parsed.success) {
          return ctx.json({ ok: false }, { status: 401 });
        }
        const claims = parsed.data;
        const { uid, email, name } = claims;
        const emailVerified = claims.email_verified ?? false;

        let user = await ctx.context.internalAdapter.findUserById(uid);
        if (!user) {
          user = await ctx.context.internalAdapter.createUser({
            id: uid,
            email: email ?? `${uid}@users.noreply.karasu256.internal`,
            emailVerified,
            name: name ?? uid,
          });
        } else if (!user.email) {
          user = await ctx.context.internalAdapter.updateUser(uid, {
            email: email ?? `${uid}@users.noreply.karasu256.internal`,
          });
        }

        const session = await ctx.context.internalAdapter.createSession(uid, false);
        await storeFirebaseCookieOnSession(session.id, sessionCookie, claims);
        await setSessionCookie(ctx, { session, user });

        return ctx.json({ ok: true });
      }),
      firebaseBridgeAdd: createAuthEndpoint(
        FIREBASE_BRIDGE_ADD_PATH,
        { method: 'POST', body: z.object({ firebaseSessionCookie: z.string().min(1) }) },
        async (ctx) => {
          const parsed = addAccountClaimsSchema.safeParse(
            await getAdminAuth()
              .verifySessionCookie(ctx.body.firebaseSessionCookie, true)
              .catch(() => null)
          );
          if (!parsed.success) {
            return ctx.json({ ok: false }, { status: 401 });
          }
          const claims = parsed.data;
          const { uid, email, name } = claims;
          const emailVerified = claims.email_verified ?? false;

          let user = await ctx.context.internalAdapter.findUserById(uid);
          if (!user) {
            user = await ctx.context.internalAdapter.createUser({
              id: uid,
              email,
              emailVerified,
              name: name ?? email,
            });
          } else if (!user.email) {
            user = await ctx.context.internalAdapter.updateUser(uid, { email });
          }

          const session = await ctx.context.internalAdapter.createSession(uid, false);
          await storeFirebaseCookieOnSession(session.id, ctx.body.firebaseSessionCookie, claims);
          await setSessionCookie(ctx, { session, user });

          return ctx.json({
            ok: true,
            sessionToken: session.token,
            uid,
            email: user.email,
            name: user.name,
            image: user.image,
          });
        }
      ),
    },
  };
}
