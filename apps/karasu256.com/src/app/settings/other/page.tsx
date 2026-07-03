import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OtherSection } from '@/components/settings/other-section';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.other.title') };
}

/** Other settings page — shows authorized apps and other miscellaneous settings. */
export default function OtherPage() {
  return <OtherSection />;
}
