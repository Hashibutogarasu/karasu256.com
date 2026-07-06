import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Header as UiHeader, AccountMenu } from '@Hashibutogarasu/ui';
import { getFirebaseUserIcon, getSessionUser, signOutAction } from '@Hashibutogarasu/utils/server';

/**
 * Site-wide header. Reads the Firebase session (shared with
 * accounts.karasu256.com via the cross-subdomain session cookie) to show an
 * account menu when authenticated, or a sign-in button when not.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const iconUrl = sessionUser ? await getFirebaseUserIcon(sessionUser.uid) : null;
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL;
  const t = await getTranslations('header');

  return (
    <UiHeader
      logo={
        <Link href="/" className="hover:text-gray-600 transition-colors">
          QR Tools
        </Link>
      }
    >
      <AccountMenu
        user={sessionUser ? { uid: sessionUser.uid, iconUrl, displayName: sessionUser.name ?? null, email: sessionUser.email ?? null } : null}
        signInHref={accountsUrl}
        settingsHref={`${rootUrl}/settings`}
        onSignOut={signOutAction}
        labels={{ signIn: t('signIn'), settings: t('settings'), signOut: t('signOut') }}
        triggerAriaLabel={t('accountMenuLabel')}
      />
    </UiHeader>
  );
};

export default Header;
