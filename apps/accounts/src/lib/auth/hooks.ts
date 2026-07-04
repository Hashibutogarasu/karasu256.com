import type { Session, User } from 'better-auth/types';
import type { GenericEndpointContext } from '@better-auth/core';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * When a social sign-in resolves to an existing linked user (as opposed to
 * the authenticated `linkSocial` flow, which never needs this), the browser
 * only ends up with a better-auth session — not a Firebase one. Since
 * Firebase remains the real session authority for the rest of the site, this
 * mints a short-lived Firebase custom token via the same cookie handoff the
 * old NextAuth flow used: `/auth/callback` (unchanged) exchanges it for a
 * real Firebase session cookie.
 */
export async function bridgeFirebaseSessionForSocialSignIn(session: Session, context: GenericEndpointContext | null): Promise<void> {
  if (!context?.path?.startsWith('/callback/')) return;

  const customToken = await getAdminAuth().createCustomToken(session.userId);
  context.setCookie('oauth_custom_token', customToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });
}

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
