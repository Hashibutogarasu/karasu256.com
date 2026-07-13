'use client';

import * as React from 'react';
import type { createAppAuthClient } from '@Hashibutogarasu/utils/client';
import type { PopUpMenuUser } from './popup-menu';

interface SessionContextValue {
  user: PopUpMenuUser | null;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
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
  initialUser: PopUpMenuUser | null;
  children: React.ReactNode;
}

/**
 * Supplies the signed-in user to `useSessionUser` for every descendant, kept
 * live via `authClient.useSession()` — a cross-origin call to whichever app
 * hosts better-auth — so signing in or out there, or in another tab, is
 * reflected across the app without a full page reload.
 */
export function SessionProvider({ authClient, initialUser, children }: SessionProviderProps) {
  const { data: session, isPending } = authClient.useSession();

  const user: PopUpMenuUser | null = isPending
    ? initialUser
    : session
      ? { uid: session.user.id, iconUrl: session.user.image, displayName: session.user.name, email: session.user.email }
      : null;

  const value = React.useMemo(() => ({ user }), [user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Returns the signed-in user supplied by the nearest `SessionProvider`.
 * Throws when rendered outside one.
 */
export function useSessionUser(): PopUpMenuUser | null {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSessionUser must be used within a SessionProvider');
  return ctx.user;
}
