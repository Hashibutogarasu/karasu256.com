'use client';

import { useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { createSession } from '@/lib/api/auth-session';

/**
 * Retrieves the Firebase custom token issued by the OAuth signIn callback,
 * completes Firebase authentication, and establishes both the session cookie
 * and the NextAuth JWT before redirecting to the settings page.
 *
 * On failure, redirects to /oauth/error.
 */
export function OAuthCallbackClient() {
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    async function completeSignIn() {
      const res = await fetch('/api/auth/oauth-token');
      if (!res.ok) {
        router.replace('/oauth/error');
        return;
      }

      const { customToken } = (await res.json()) as { customToken: string };
      const credential = await signInWithCustomToken(getFirebaseAuth(), customToken);
      const idToken = await credential.user.getIdToken();
      await createSession(idToken);
      nextAuthSignIn('credentials', { idToken, redirect: false }).catch(() => {});
      router.replace('/settings');
    }

    completeSignIn().catch(() => router.replace('/oauth/error'));
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
      <p className="text-sm">{t('oauthCallback.redirecting')}</p>
    </div>
  );
}
