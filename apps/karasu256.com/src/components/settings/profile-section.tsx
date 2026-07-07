'use client';

import { useTranslations } from 'next-intl';
import { UserAvatar } from '@Hashibutogarasu/ui';
import { AccountPortalLink } from './account-portal-link';

interface ProfileSectionProps {
  uid: string;
  email: string | null;
  iconUrl: string | null;
}

/**
 * Profile settings section. Displays the current user's avatar, email,
 * and a link to the accounts portal for full profile management.
 */
export function ProfileSection({ uid, email, iconUrl }: ProfileSectionProps) {
  const t = useTranslations();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('settings.profile.title')}</h1>

      <div className="flex items-center gap-4">
        <UserAvatar uid={uid} iconUrl={iconUrl} size={56} className="border border-border" />
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">{t('settings.profile.email')}</p>
          <p className="text-sm font-medium break-all">{email ?? uid}</p>
        </div>
      </div>

      <AccountPortalLink accountsUrl={accountsUrl} />
    </div>
  );
}
