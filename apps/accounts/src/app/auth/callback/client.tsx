'use client';

import { useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@Hashibutogarasu/ui';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { createSession } from '@/lib/api/auth-session';

/**
 * Retrieves the Firebase custom token issued by the OAuth signIn callback,
 * completes Firebase authentication, and establishes the session cookie
 * before redirecting to the settings page.
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
      router.replace('/settings');
    }

    completeSignIn().catch(() => router.replace('/oauth/error'));
  }, [router]);

  return <LoadingView message={t('oauthCallback.redirecting')} />;
}
