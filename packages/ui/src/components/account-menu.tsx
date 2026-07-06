'use client';

import * as React from 'react';
import { Button } from './button';
import { UserIcon, type KarasuUser } from './user-icon';
import { PopUpMenu } from './popup-menu';
import { DropdownMenuItem } from './ui/dropdown-menu';

export interface AccountMenuLabels {
  signIn?: string;
  settings?: string;
  signOut?: string;
}

export interface AccountMenuProps {
  /** The signed-in user, or `null` to render a sign-in button instead. */
  user: KarasuUser | null;
  /** Destination for the sign-in button. */
  signInHref: string;
  /** Destination for the "settings" menu item. */
  settingsHref: string;
  /** Invoked (as a form action) when the "sign out" menu item is submitted. */
  onSignOut: () => void | Promise<void>;
  labels?: AccountMenuLabels;
  triggerAriaLabel?: string;
}

const defaultLabels: Required<AccountMenuLabels> = {
  signIn: 'サインイン',
  settings: '設定',
  signOut: 'サインアウト',
};

/**
 * Renders a sign-in button when unauthenticated, or an account dropdown menu
 * when authenticated. The dropdown shows the user's avatar, display name,
 * email address, a configurable settings link, and a configurable sign-out
 * action, so callers can point them at whichever app hosts settings/auth.
 */
export function AccountMenu({ user, signInHref, settingsHref, onSignOut, labels, triggerAriaLabel }: AccountMenuProps) {
  const { signIn, settings, signOut } = { ...defaultLabels, ...labels };

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          window.location.href = signInHref;
        }}
      >
        {signIn}
      </Button>
    );
  }

  return (
    <UserIcon user={user} triggerAriaLabel={triggerAriaLabel}>
      <PopUpMenu>
        <DropdownMenuItem render={<a href={settingsHref} />}>{settings}</DropdownMenuItem>
        <form action={onSignOut}>
          <DropdownMenuItem nativeButton={true} render={<button type="submit" className="w-full" />}>
            {signOut}
          </DropdownMenuItem>
        </form>
      </PopUpMenu>
    </UserIcon>
  );
}
