'use client';

import { useTranslations } from 'next-intl';
import { UserAvatar, Button, Menu, MenuTrigger, MenuContent, MenuItem } from '@Hashibutogarasu/ui';
import { signOutAction } from '@/app/actions/auth';

interface AuthButtonProps {
  accountsUrl: string;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  iconUrl: string | null;
}

/**
 * Renders a sign-in button when unauthenticated, or an account dropdown menu
 * when authenticated. The dropdown shows the user's avatar, display name, email address,
 * a link to account settings, and a sign-out button.
 */
export function AuthButton({ accountsUrl, uid, displayName, email, iconUrl }: AuthButtonProps) {
  const t = useTranslations();

  if (!uid) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          window.location.href = accountsUrl;
        }}
      >
        {t('header.signIn')}
      </Button>
    );
  }

  return (
    <Menu>
      <MenuTrigger
        className="block p-0 bg-transparent border-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t('header.accountMenuLabel')}
      >
        <UserAvatar uid={uid} iconUrl={iconUrl} size={36} className="border border-border [&>svg]:block" />
      </MenuTrigger>
      <MenuContent side="bottom" align="end" sideOffset={8} className="w-auto min-w-48">
        <div className="flex flex-col items-start gap-2 px-3 py-4">
          <UserAvatar uid={uid} iconUrl={iconUrl} size={40} className="border border-border [&>svg]:block" />
          {displayName && <span className="text-sm font-medium">{displayName}</span>}
          <span className="text-sm text-muted-foreground break-all">{email ?? uid}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="p-1">
          <MenuItem render={<a href="/settings" />}>{t('header.settings')}</MenuItem>
          <form action={signOutAction}>
            <MenuItem nativeButton={true} render={<button type="submit" className="w-full" />}>
              {t('header.signOut')}
            </MenuItem>
          </form>
        </div>
      </MenuContent>
    </Menu>
  );
}
