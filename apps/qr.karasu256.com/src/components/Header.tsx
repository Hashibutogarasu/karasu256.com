import Link from 'next/link';
import { Header as UiHeader } from '@Hashibutogarasu/ui';
import { getFirebaseUserIcon, getSessionUser } from '@Hashibutogarasu/utils/server';
import { AccountMenu } from '@/components/account-menu';

/**
 * Site-wide header. Reads the Firebase session (shared with
 * accounts.karasu256.com via the cross-subdomain session cookie) to show an
 * account menu when authenticated, or a sign-in button when not.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const iconUrl = sessionUser ? await getFirebaseUserIcon(sessionUser.uid) : null;
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? '#';

  return (
    <UiHeader
      logo={
        <Link href="/" className="hover:text-gray-600 transition-colors">
          QR Tools
        </Link>
      }
    >
      <AccountMenu
        accountsUrl={accountsUrl}
        uid={sessionUser?.uid ?? null}
        displayName={sessionUser?.name ?? null}
        email={sessionUser?.email ?? null}
        iconUrl={iconUrl}
      />
    </UiHeader>
  );
};

export default Header;
