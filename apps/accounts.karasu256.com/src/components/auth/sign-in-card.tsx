'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth/client';
import { Container, CardContent, CardHeader } from '@Hashibutogarasu/ui';
import { Separator } from '@Hashibutogarasu/ui';
import { Skeleton } from '@Hashibutogarasu/ui';
import { EmailPasswordForm } from './email-password-form';
import { PasskeySection } from './passkey-section';
import { SocialButtons } from './social-buttons';

/**
 * Sign-in card for unauthenticated users. Redirects to `/settings` once a
 * better-auth session exists — `proxy.ts` normally does this at the edge
 * first, so this mainly covers the moment right after one of the sign-in
 * forms below establishes a session client-side.
 */
export function SignInCard() {
  const router = useRouter();
  const t = useTranslations();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) router.replace('/settings');
  }, [session, router]);

  if (isPending || session) {
    return (
      <Container className="max-w-sm">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Container>
    );
  }

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">{t('signIn.title')}</CardHeader>
      <CardContent className="space-y-6">
        <EmailPasswordForm />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t('signIn.or')}</span>
          <Separator className="flex-1" />
        </div>
        <SocialButtons />
        <PasskeySection />
      </CardContent>
    </Container>
  );
}
