'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { createSession } from '@/lib/api/auth-session';
import { Container, CardContent, CardHeader } from '@Hashibutogarasu/ui';
import { Separator } from '@Hashibutogarasu/ui';
import { Skeleton } from '@Hashibutogarasu/ui';
import { EmailPasswordForm } from './email-password-form';
import { PasskeySection } from './passkey-section';
import { SocialButtons } from './social-buttons';

/**
 * Sign-in card for unauthenticated users.
 *
 * Renders server-rendered from the start, with the sign-in button and text
 * inputs disabled until the Firebase auth state is known (avoids a flash of
 * enabled controls that get disabled again once a signed-in user starts
 * redirecting). Only the external provider button area shows a skeleton, since
 * it has no meaningful disabled state to render up front.
 *
 * On Firebase auth state change to a signed-in user:
 * 1. Creates a Firebase session cookie via {@link createSession}.
 * 2. Redirects to `/settings`.
 */
export function SignInCard() {
  const router = useRouter();
  const t = useTranslations();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let redirecting = false;
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setReady(true);
        return;
      }
      if (redirecting) return;
      redirecting = true;
      try {
        const idToken = await user.getIdToken();
        await createSession(idToken);
        router.replace('/settings');
      } catch {
        redirecting = false;
        setReady(true);
      }
    });
  }, [router]);

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">{t('signIn.title')}</CardHeader>
      <CardContent className="space-y-6">
        <EmailPasswordForm disabled={!ready} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t('signIn.or')}</span>
          <Separator className="flex-1" />
        </div>
        {ready ? (
          <SocialButtons />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        <PasskeySection disabled={!ready} />
      </CardContent>
    </Container>
  );
}
