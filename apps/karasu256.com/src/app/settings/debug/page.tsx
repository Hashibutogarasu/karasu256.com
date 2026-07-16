import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DebugSection } from '@/components/settings/debug-section';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.debug.title') };
}

/** Debug settings page — displays the live value of demo feature flags. */
export default function DebugPage() {
  return <DebugSection />;
}
