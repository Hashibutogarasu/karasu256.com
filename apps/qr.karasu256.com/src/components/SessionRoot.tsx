'use client';

import { SessionProvider, type SessionProviderProps } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';

/**
 * Binds this app's `authClient` singleton to `SessionProvider`. Kept as a
 * dedicated client module so `authClient` (a `better-auth/react` client,
 * whose methods are functions) is never passed as a prop from the Server
 * Component root layout — React Server Components strip function-valued
 * props when serializing across the server/client boundary, which would
 * otherwise make `authClient.useSession` undefined at runtime.
 */
export function SessionRoot({ initialUser, children }: Omit<SessionProviderProps, 'authClient'>) {
  return (
    <SessionProvider authClient={authClient} initialUser={initialUser}>
      {children}
    </SessionProvider>
  );
}
