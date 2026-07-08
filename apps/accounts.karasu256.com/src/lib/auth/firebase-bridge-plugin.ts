import { createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import type { BetterAuthPlugin } from 'better-auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export const FIREBASE_BRIDGE_PATH = '/firebase-bridge';

/**
 * Synthesizes a real better-auth session from an already-verified Firebase
 * session cookie. Firebase remains the actual login authority; this plugin
 * only exists so `oauthProvider`'s `/oauth2/authorize` flow (which checks
 * better-auth's own session to know who's logged in) recognizes a user who
 * is already signed in via Firebase, without requiring a second login.
 *
 * The resulting `users` row is keyed by the Firebase UID via
 * `internalAdapter.createUser({ id: uid, ... })` — `forceAllowId` in
 * better-auth's create pipeline honors an explicitly supplied `id`.
 *
 * Also backfills a null `email` on a pre-existing row (e.g. from the
 * NextAuth migration), since better-auth's `linkSocial` flow requires a
 * non-null `session.user.email` to build its OAuth state.
 */
export function firebaseSessionBridgePlugin(): BetterAuthPlugin {
  return {
    id: 'firebase-session-bridge',
    endpoints: {
      firebaseBridge: createAuthEndpoint(FIREBASE_BRIDGE_PATH, { method: 'POST' }, async (ctx) => {
        const sessionCookie = ctx.getCookie(SESSION_COOKIE_NAME);
        if (!sessionCookie) {
          return ctx.json({ ok: false }, { status: 401 });
        }

        let uid: string;
        let email: string | undefined;
        let emailVerified: boolean;
        let name: string | undefined;
        try {
          const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
          uid = decoded.uid;
          email = decoded.email;
          emailVerified = decoded.email_verified ?? false;
          name = typeof decoded.name === 'string' ? decoded.name : undefined;
        } catch {
          return ctx.json({ ok: false }, { status: 401 });
        }

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
        await setSessionCookie(ctx, { session, user });

        return ctx.json({ ok: true });
      }),
    },
  };
}
