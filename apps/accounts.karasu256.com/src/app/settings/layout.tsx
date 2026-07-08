import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsShell } from './shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.title') };
}

/**
 * Settings layout. The "back to app" URL is no longer passed down from here —
 * {@link SettingsShell} derives it client-side from the current hostname, so
 * it doesn't depend on `NEXT_PUBLIC_APP_URL` being correctly configured per
 * deployment environment.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
