import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getFirebaseUserIcon, getSessionUser } from '@Hashibutogarasu/utils/server';
import { SettingsShell } from '@/components/settings-shell';
import { MissingEnvError } from '@/lib/missing-env-error';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.title') };
}

/**
 * Settings layout. Redirects unauthenticated users to the accounts portal,
 * then renders the shared sidebar shell around the page content.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const token = await getSessionUser();
  if (!token) {
    const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
    if (!accountsUrl) {
      throw new MissingEnvError('NEXT_PUBLIC_ACCOUNTS_URL');
    }
    redirect(accountsUrl);
  }
  const photoURL = await getFirebaseUserIcon(token.uid);
  const user = {
    uid: token.uid,
    displayName: token.name ?? null,
    email: token.email ?? null,
    photoURL,
  };
  return <SettingsShell user={user}>{children}</SettingsShell>;
}
