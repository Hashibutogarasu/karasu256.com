'use client';

import { AccountMenu, type AccountMenuProps } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';

export type HeaderAccountMenuProps = Omit<AccountMenuProps, 'user'> & {
  /** Server-rendered session user, shown until the client-side session fetch below resolves. */
  initialUser: AccountMenuProps['user'];
};

/**
 * Wraps {@link AccountMenu} with a live better-auth session fetched
 * client-side from accounts.karasu256.com via `authClient.useSession()`, so
 * signing in or out there (or in another tab) is reflected here without a
 * full page reload. Falls back to the server-rendered `initialUser` while
 * the client-side fetch is still in flight.
 */
export function HeaderAccountMenu({ initialUser, ...rest }: HeaderAccountMenuProps) {
  const { data: session, isPending } = authClient.useSession();

  const user = isPending
    ? initialUser
    : session
      ? { uid: session.user.id, iconUrl: session.user.image, displayName: session.user.name, email: session.user.email }
      : null;

  return <AccountMenu user={user} {...rest} />;
}
