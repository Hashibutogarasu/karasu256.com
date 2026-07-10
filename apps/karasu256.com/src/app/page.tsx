import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getFirebaseUserProfile, getSessionUser } from '@Hashibutogarasu/utils/server';
import { TopPageShell } from '@/components/top-page-shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('home.title') };
}

/** Home page — a drag-and-drop playground. Renders for anonymous visitors too. */
export default async function Home() {
  const token = await getSessionUser();
  const user = token ? { uid: token.uid, ...(await getFirebaseUserProfile(token.uid)) } : null;
  return <TopPageShell user={user} />;
}
