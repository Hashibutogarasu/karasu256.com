'use client';

import * as React from 'react';
import type { createAppAuthClient } from '@Hashibutogarasu/utils/client';
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
  /**
   * The calling app's better-auth client, as returned by
   * `createAppAuthClient`. Its `useSession()` hook is the live source of
   * truth for the signed-in user.
   */
  authClient: ReturnType<typeof createAppAuthClient>['authClient'];
  /**
   * Server-rendered session user, shown until `authClient.useSession()`
   * resolves, so there is no flash of signed-out UI on first paint.
   */
  initialUser: KarasuUser | null;
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
 *
 * The signed-in user is read live via `authClient.useSession()` — a
 * cross-origin call to whichever app hosts better-auth — so signing in or
 * out there, or in another tab, is reflected here without a full page
 * reload.
 */
export function AccountMenu({ authClient, initialUser, signInHref, settingsHref, onSignOut, labels, triggerAriaLabel }: AccountMenuProps) {
  const { signIn, settings, signOut } = { ...defaultLabels, ...labels };
  const { data: session, isPending } = authClient.useSession();

  const user: KarasuUser | null = isPending
    ? initialUser
    : session
      ? { uid: session.user.id, iconUrl: session.user.image, displayName: session.user.name, email: session.user.email }
      : null;

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
