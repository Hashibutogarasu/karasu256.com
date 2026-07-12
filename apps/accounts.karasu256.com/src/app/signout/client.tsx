'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@Hashibutogarasu/ui';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { clearSession } from '@/lib/api/auth-session';
import { authClient } from '@/lib/auth/client';

/**
 * Clears the Firebase Auth state, the better-auth session (the session
 * every app now trusts for "who is logged in"), and the server-side
 * Firebase session cookie, then navigates to the `next` search param URL.
 */
export function SignOutClient() {
  const searchParams = useSearchParams();
  const t = useTranslations();

  useEffect(() => {
    async function performSignOut() {
      try {
        await authClient.signOut();
        await clearSession();
        await signOut(getFirebaseAuth());
      } finally {
        window.location.replace(searchParams.get('next') ?? '/');
      }
    }
    performSignOut();
  }, [searchParams]);

  return <LoadingView message={t('settings.signingOut')} />;
}
