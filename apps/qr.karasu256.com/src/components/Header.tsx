import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Header as UiHeader, AccountMenu, type CountryCode } from '@Hashibutogarasu/ui';
import { getFirebaseUserProfile, getSessionUser, getRootDomainUrl, signOutAction, setLocaleAction } from '@Hashibutogarasu/utils/server';
import { locales } from '@/i18n/locales';

const localeLabels: Record<(typeof locales)[number], { label: string; countryCode: CountryCode }> = {
  ja: { label: '日本語', countryCode: 'JP' },
  en: { label: 'English', countryCode: 'US' },
  cn: { label: '中文', countryCode: 'CN' },
};

/**
 * Site-wide header. Reads the Firebase session (shared with
 * accounts.karasu256.com via the cross-subdomain session cookie) to show an
 * account menu when authenticated, or a sign-in button when not, plus a
 * language switcher.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const { displayName, photoURL: iconUrl } = await getFirebaseUserProfile(sessionUser?.uid);
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  const rootUrl = await getRootDomainUrl();
  const t = await getTranslations('header');
  const currentLocale = await getLocale();

  return (
    <UiHeader
      logo={
        <Link href="/" className="hover:text-gray-600 transition-colors">
          QR Tools
        </Link>
      }
      locales={localeLabels}
      currentLocale={currentLocale}
      onLocaleChange={setLocaleAction}
    >
      <AccountMenu
        user={sessionUser ? { uid: sessionUser.uid, iconUrl, displayName, email: sessionUser.email ?? null } : null}
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
