import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSessionUser } from '@Hashibutogarasu/utils/server';
import { ProfileSection } from '@/components/settings/profile-section';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('settings.profile.title') };
}

/** Profile settings page — shows the current user's info. */
export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  return <ProfileSection uid={sessionUser!.uid} email={sessionUser!.email} iconUrl={sessionUser!.image} />;
}
