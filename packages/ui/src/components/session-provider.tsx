'use client';

import * as React from 'react';
import { setSessionToken } from '@Hashibutogarasu/utils/client';
import type { PopUpMenuUser } from './popup-menu';

const SessionContext = React.createContext<PopUpMenuUser | null | undefined>(undefined);

export interface SessionProviderProps {
  /**
   * Base URL of the better-auth instance, forwarded to the direct
   * `get-session` fetch (see that function for when this is required).
   * Passed as a plain string rather than an already-constructed client so
   * this component's props stay serializable across the Server Component
   * boundary.
   */
  baseURL?: string;
  /**
   * Server-rendered session user, shown until the client-side session fetch
   * resolves, so there is no flash of signed-out UI on first paint.
   */
  initialUser: PopUpMenuUser | null;
  children: React.ReactNode;
}

interface GetSessionResponse {
  user?: { id: string; email?: string | null; name?: string | null; image?: string | null } | null;
}

/**
 * Supplies the signed-in user to every descendant, and keeps `apiFetch`
 * (`@Hashibutogarasu/utils/client`) authenticated via `setSessionToken`.
 * Kept live via a single direct `GET /api/auth/get-session` call to
 * whichever app hosts better-auth — a cross-origin call to that app's own
 * domain, so it always sees that app's session cookie regardless of which
 * app's page it was called from — so signing in or out there, or in
 * another tab, is reflected across the app without a full page reload.
 *
 * This is the single source of truth for "who is logged in": components
 * calling another app's API should use `apiFetch` rather than `fetch`, and
 * that other app's server should verify the token it attaches with
 * `verifyAppJwt` from `@Hashibutogarasu/utils/server` rather than
 * re-deriving session state from a forwarded `Cookie` header, which isn't
 * guaranteed to reach it.
 */
export function SessionProvider({ baseURL, initialUser, children }: SessionProviderProps) {
  const [user, setUser] = React.useState<PopUpMenuUser | null>(initialUser);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const url = baseURL ? `${baseURL}/api/auth/get-session` : '/api/auth/get-session';
        const res = await fetch(url, { credentials: 'include' });
        if (cancelled) return;

        if (!res.ok) {
          setSessionToken(null);
          setUser(null);
          return;
        }

        const data = (await res.json()) as GetSessionResponse;
        if (!data.user) {
          setSessionToken(null);
          setUser(null);
          return;
        }

        setSessionToken(res.headers.get('set-auth-jwt'));
        setUser({ uid: data.user.id, iconUrl: data.user.image ?? null, displayName: data.user.name ?? null, email: data.user.email ?? null });
      } catch {
        if (!cancelled) {
          setSessionToken(null);
          setUser(null);
        }
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [baseURL]);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/**
 * Returns the signed-in user supplied by the nearest `SessionProvider`.
 * Throws when rendered outside one.
 */
export function useSessionUser(): PopUpMenuUser | null {
  const ctx = React.useContext(SessionContext);
  if (ctx === undefined) throw new Error('useSessionUser must be used within a SessionProvider');
  return ctx;
}
