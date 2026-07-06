'use client';

import { Button, UserIcon, PopUpMenu, MenuItem } from '@Hashibutogarasu/ui';
import { signOutAction } from '@/app/actions/auth';

interface AccountMenuProps {
  accountsUrl: string;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  iconUrl: string | null;
}

/**
 * Renders a sign-in button when unauthenticated, or an account dropdown menu
 * when authenticated. The dropdown shows the user's avatar, display name, email address,
 * a link to the accounts portal, and a sign-out button.
 */
export function AccountMenu({ accountsUrl, uid, displayName, email, iconUrl }: AccountMenuProps) {
  if (!uid) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          window.location.href = accountsUrl;
        }}
      >
        サインイン
      </Button>
    );
  }

  return (
    <UserIcon user={{ uid, iconUrl, displayName, email }} triggerAriaLabel="アカウントメニュー">
      <PopUpMenu>
        <MenuItem render={<a href={`${accountsUrl}/settings`} />}>設定</MenuItem>
        <form action={signOutAction}>
          <MenuItem nativeButton={true} render={<button type="submit" className="w-full" />}>
            サインアウト
          </MenuItem>
        </form>
      </PopUpMenu>
    </UserIcon>
  );
}
