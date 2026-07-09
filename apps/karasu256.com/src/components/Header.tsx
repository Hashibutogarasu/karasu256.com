import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Header as UiHeader, AccountMenu } from '@Hashibutogarasu/ui';
import { getFirebaseUserIcon, getSessionUser, signOutAction, setLocaleAction } from '@Hashibutogarasu/utils/server';
import { locales } from '@/i18n/locales';

const localeLabels: Record<(typeof locales)[number], string> = {
  ja: '日本語',
  en: 'English',
  cn: '中文',
};

/**
 * Site-wide header. Reads the Firebase session to show an account menu when
 * authenticated, or a sign-in button when not, plus a language switcher.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const iconUrl = sessionUser ? await getFirebaseUserIcon(sessionUser.uid) : null;
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  const t = await getTranslations('header');
  const currentLocale = await getLocale();

  return (
    <UiHeader
      logo={
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Karasu Lab
        </Link>
      }
      locales={localeLabels}
      currentLocale={currentLocale}
      onLocaleChange={setLocaleAction}
    >
      <AccountMenu
        user={sessionUser ? { uid: sessionUser.uid, iconUrl, displayName: sessionUser.name ?? null, email: sessionUser.email ?? null } : null}
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
