'use client';

import * as React from 'react';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu';
import { UserAvatar } from './user-avatar';
import { PopUpMenuUserContext, usePopUpMenuContext, type PopUpMenuUser } from './popup-menu';
import { cn } from '../lib/utils';

export type KarasuUser = PopUpMenuUser;

export interface UserIconProps {
  user: KarasuUser;
  size?: number;
  triggerAriaLabel?: string;
  className?: string;
  /** Expected to be a single `PopUpMenu`. */
  children: React.ReactNode;
}

/**
 * Renders the user's avatar as a menu trigger and coordinates with the
 * nearest `PopUpMenuProvider` so only one popup stays open across the page.
 */
export function UserIcon({ user, size = 36, triggerAriaLabel, className, children }: UserIconProps) {
  const { openId, setOpenId } = usePopUpMenuContext();
  const open = openId === user.uid;

  return (
    <PopUpMenuUserContext.Provider value={user}>
      <DropdownMenu open={open} onOpenChange={(next) => setOpenId(next ? user.uid : null)}>
        <DropdownMenuTrigger
          className={cn(
            'block p-0 bg-transparent border-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            className
          )}
          aria-label={triggerAriaLabel}
        >
          <UserAvatar uid={user.uid} iconUrl={user.iconUrl} size={size} className="border border-border [&>svg]:block" />
        </DropdownMenuTrigger>
        {children}
      </DropdownMenu>
    </PopUpMenuUserContext.Provider>
  );
}
