'use client';

import * as React from 'react';
import { createAppAuthClient } from '@Hashibutogarasu/utils/client';
import type { PopUpMenuUser } from './popup-menu';

interface SessionContextValue {
  user: PopUpMenuUser | null;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  /**
   * Base URL of the better-auth instance, forwarded to `createAppAuthClient`
   * (see that function for when this is required). Passed as a plain string
   * rather than an already-constructed client so this component's props stay
   * serializable across the Server Component boundary — a constructed
   * `better-auth/react` client is mostly functions, which React Server
   * Components silently strip from props, leaving `useSession` undefined at
   * runtime.
   */
  baseURL?: string;
  /**
   * Server-rendered session user, shown until the client-side session fetch
   * resolves, so there is no flash of signed-out UI on first paint.
   */
  initialUser: PopUpMenuUser | null;
  children: React.ReactNode;
}

/**
 * Supplies the signed-in user to `useSessionUser` for every descendant, kept
 * live via a better-auth client's `useSession()` — a cross-origin call to
 * whichever app hosts better-auth — so signing in or out there, or in
 * another tab, is reflected across the app without a full page reload.
 */
export function SessionProvider({ baseURL, initialUser, children }: SessionProviderProps) {
  const { authClient } = React.useMemo(() => createAppAuthClient({ baseURL }), [baseURL]);
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
