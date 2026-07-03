import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSessionUser } from '@/lib/firebase-session';
import { SettingsShell } from '@/components/settings-shell';

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
    redirect(process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? '/');
  }
  const user = {
    uid: token.uid,
    displayName: token.name ?? null,
    email: token.email ?? null,
    photoURL: token.picture ?? null,
  };
  return <SettingsShell user={user}>{children}</SettingsShell>;
}
