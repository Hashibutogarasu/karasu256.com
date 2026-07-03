import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getUser } from '@Hashibutogarasu/db';
import { getSessionUser } from '@/lib/firebase-session';
import { ProfileSection } from '@/components/settings/profile-section';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.profile.title') };
}

/** Profile settings page — shows the current user's info. */
export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  const dbUser = await getUser(sessionUser!.uid);
  return <ProfileSection uid={sessionUser!.uid} email={sessionUser!.email ?? null} iconUrl={dbUser?.iconUrl ?? null} />;
}
