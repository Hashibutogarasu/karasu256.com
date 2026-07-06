'use client';

import * as React from 'react';
import { DropdownMenuContent, DropdownMenuSeparator } from './ui/dropdown-menu';
import { UserAvatar } from './user-avatar';
import { cn } from '../lib/utils';

interface PopUpMenuContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  portalContainer: HTMLElement | null;
}

const PopUpMenuContext = React.createContext<PopUpMenuContextValue | null>(null);

export function usePopUpMenuContext(): PopUpMenuContextValue {
  const ctx = React.useContext(PopUpMenuContext);
  if (!ctx) throw new Error('usePopUpMenuContext must be used within a <PopUpMenuProvider>');
  return ctx;
}

export interface PopUpMenuProviderProps {
  children: React.ReactNode;
}

/**
 * Coordinates every `PopUpMenu` on the page: only one stays open at a time,
 * and all of them portal into a single fixed, high z-index container so they
 * are never clipped by a `sticky`/`overflow` ancestor such as the header.
 */
export function PopUpMenuProvider({ children }: PopUpMenuProviderProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);

  const value = React.useMemo(() => ({ openId, setOpenId, portalContainer }), [openId, portalContainer]);

  return (
    <PopUpMenuContext.Provider value={value}>
      {children}
      <div ref={setPortalContainer} className="pointer-events-none fixed inset-0 z-[60] [&>*]:pointer-events-auto" />
    </PopUpMenuContext.Provider>
  );
}

export interface PopUpMenuUser {
  uid: string;
  iconUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export const PopUpMenuUserContext = React.createContext<PopUpMenuUser | null>(null);

export function usePopUpMenuUser(): PopUpMenuUser | null {
  return React.useContext(PopUpMenuUserContext);
}

export interface PopUpMenuProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

/**
 * The popup surface rendered by a `UserIcon`. Shows the current user's
 * avatar/display name/email above `children` when nested inside `UserIcon`,
 * and portals into the container managed by the nearest `PopUpMenuProvider`.
 */
export function PopUpMenu({ children, side = 'bottom', align = 'end', sideOffset = 8, className }: PopUpMenuProps) {
  const { portalContainer } = usePopUpMenuContext();
  const user = usePopUpMenuUser();

  return (
    <DropdownMenuContent side={side} align={align} sideOffset={sideOffset} container={portalContainer} className={cn('w-auto min-w-48', className)}>
      {user && (
        <>
          <div className="flex flex-col items-start gap-2 px-3 py-4">
            <UserAvatar uid={user.uid} iconUrl={user.iconUrl} size={40} className="border border-border [&>svg]:block" />
            {user.displayName && <span className="text-sm font-medium">{user.displayName}</span>}
            <span className="text-sm text-muted-foreground break-all">{user.email ?? user.uid}</span>
          </div>
          <DropdownMenuSeparator />
        </>
      )}
      <div className="p-1">{children}</div>
    </DropdownMenuContent>
  );
}
