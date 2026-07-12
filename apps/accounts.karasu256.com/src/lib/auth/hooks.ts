import { createAuthMiddleware, APIError } from 'better-auth/api';
import type { User } from 'better-auth/types';
import { getAdminAuth } from '@/lib/firebase-admin';
import { syncFirebaseUserToNeonAuth } from '@/lib/neon-auth-bridge';

/**
 * When a social sign-in resolves to an existing linked user (as opposed to
 * the authenticated `linkSocial` flow, which never needs this), the browser
 * only ends up with a better-auth session — not a Firebase one. Since
 * Firebase remains the real session authority for the rest of the site, this
 * mints a short-lived Firebase custom token via the same cookie handoff the
 * old NextAuth flow used: `/auth/callback` (unchanged) exchanges it for a
 * real Firebase session cookie.
 *
 * Implemented as a top-level `hooks.after` middleware rather than a
 * `databaseHooks.session.create.after` hook — the latter runs outside the
 * endpoint's response context, so `ctx.setCookie` there does not reliably
 * attach to the actual HTTP response.
 *
 * If minting the token fails (e.g. the better-auth `session.userId` has no
 * corresponding Firebase user), this rethrows as an `APIError` — a plain
 * thrown error from a `hooks.after` middleware is not recognized by
 * better-auth's dispatch pipeline (only `APIError` instances are), so it
 * would otherwise propagate uncaught instead of being routed through the
 * configured `onAPIError.errorURL` (`/oauth/error`).
 */
export const bridgeFirebaseSessionForSocialSignIn = createAuthMiddleware(async (ctx) => {
  if (!ctx.path.startsWith('/callback/')) return;

  const newSession = ctx.context.newSession;
  if (!newSession) return;

  let customToken: string;
  try {
    customToken = await getAdminAuth().createCustomToken(newSession.session.userId);
  } catch (err) {
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: `Failed to mint Firebase custom token for user ${newSession.session.userId}: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  ctx.setCookie('oauth_custom_token', customToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });
});

/**
 * better-auth's `user` row (name/image) is now the source of truth for
 * profile edits — see `profile-section.tsx`, which calls
 * `authClient.updateUser()` instead of writing to Firebase directly. Mirror
 * both fields onto the Firebase user immediately after any update (from the
 * profile form, or `account.accountLinking.updateUserInfoOnLink` copying a
 * newly linked provider's avatar) so Firebase — kept only for backing ID/auth
 * concerns — still reflects the current name and photo.
 */
export async function syncProfileToFirebase(user: User & { name?: string | null; image?: string | null }): Promise<void> {
  const update: { displayName?: string; photoURL?: string } = {};
  if (user.name) update.displayName = user.name;
  if (user.image) update.photoURL = user.image;
  if (Object.keys(update).length === 0) return;
  await getAdminAuth().updateUser(user.id, update);
}

/**
 * Provisions a Firebase user for every new better-auth user and forces
 * better-auth's `user.id` to equal the resulting Firebase UID — every table
 * and R2/CDN storage path in this monorepo is keyed by that id.
 */
export async function provisionFirebaseUser(user: User): Promise<{ data: User }> {
  const firebaseUser = await getAdminAuth().createUser({
    email: user.email || undefined,
    emailVerified: user.emailVerified,
    displayName: user.name || undefined,
  });
  return { data: { ...user, id: firebaseUser.uid } };
}

/** Mirrors a newly created better-auth user into Neon Auth (see `neon-auth-bridge.ts`). */
export async function syncNewUserToNeonAuth(user: User): Promise<void> {
  await syncFirebaseUserToNeonAuth({ uid: user.id, email: user.email, name: user.name });
}
