import { createAuthMiddleware } from 'better-auth/api';
import type { User } from 'better-auth/types';
import { getAdminAuth } from '@/lib/firebase-admin';

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
 */
export const bridgeFirebaseSessionForSocialSignIn = createAuthMiddleware(async (ctx) => {
  if (!ctx.path.startsWith('/callback/')) return;

  const newSession = ctx.context.newSession;
  if (!newSession) return;

  const customToken = await getAdminAuth().createCustomToken(newSession.session.userId);
  ctx.setCookie('oauth_custom_token', customToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });
});

/**
 * Firebase's own user record is the single source of truth for the site's
 * profile photo — never a value cached in better-auth's own tables. When
 * `account.accountLinking.updateUserInfoOnLink` copies a newly linked
 * provider's avatar into better-auth's `user.image` field, mirror it onto
 * the Firebase user immediately so `photoURL` reflects it everywhere.
 */
export async function syncProfileImageToFirebase(user: User & { image?: string | null }): Promise<void> {
  if (!user.image) return;
  await getAdminAuth().updateUser(user.id, { photoURL: user.image });
}
