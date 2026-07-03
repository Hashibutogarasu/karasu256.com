import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsShell } from './shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.title') };
}

/**
 * Reads NEXT_PUBLIC_APP_URL at request time on the server and passes it to
 * the client shell as a prop, preventing the value from being undefined when
 * the variable is absent from the client-side build bundle.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell appUrl={process.env.NEXT_PUBLIC_APP_URL}>{children}</SettingsShell>;
}
