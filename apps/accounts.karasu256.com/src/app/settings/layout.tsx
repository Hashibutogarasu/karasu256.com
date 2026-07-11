import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getMainAppUrlFromBaseDomain } from '@/lib/get-main-app-url';
import { SettingsShell } from './shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.title') };
}

/**
 * Settings layout. Computes the "back to app" URL server-side from
 * `BASE_DOMAIN` and passes it down as {@link SettingsShell}'s `appUrl`.
 * Deriving it purely from the client's hostname (the previous approach)
 * collapsed preview hosts with more than one subdomain label
 * (`dev.accounts.karasu256.com`) to the production root domain instead of
 * the sibling preview app.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell appUrl={getMainAppUrlFromBaseDomain()}>{children}</SettingsShell>;
}
