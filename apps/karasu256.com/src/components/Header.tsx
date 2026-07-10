import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Header as UiHeader, AccountMenu } from '@Hashibutogarasu/ui';
import { getFirebaseUserProfile, getSessionUser, signOutAction } from '@Hashibutogarasu/utils/server';

/**
 * Site-wide header. Reads the Firebase session to show an account menu when
 * authenticated, or a sign-in button when not.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const { displayName, photoURL: iconUrl } = await getFirebaseUserProfile(sessionUser?.uid);
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  const t = await getTranslations('header');

  return (
    <UiHeader
      logo={
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Karasu Lab
        </Link>
      }
    >
      <AccountMenu
        user={sessionUser ? { uid: sessionUser.uid, iconUrl, displayName, email: sessionUser.email ?? null } : null}
        signInHref={accountsUrl}
        settingsHref="/settings"
        onSignOut={signOutAction}
        labels={{ signIn: t('signIn'), settings: t('settings'), signOut: t('signOut') }}
        triggerAriaLabel={t('accountMenuLabel')}
      />
    </UiHeader>
  );
};

export default Header;
