import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TopPageShell } from '@/components/top-page-shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('home.title') };
}

/**
 * Home page — a drag-and-drop playground. Renders for anonymous visitors
 * too. `TopPageShell` reads the signed-in user itself via `useSessionUser`
 * (see that component), so this route doesn't fetch its own session.
 */
export default function Home() {
  return <TopPageShell />;
}
