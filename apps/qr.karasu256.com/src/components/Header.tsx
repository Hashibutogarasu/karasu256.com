import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Header as UiHeader, type CountryCode } from '@Hashibutogarasu/ui';
import { getSessionUser, getRootAppUrl, signOutAction, setLocaleAction } from '@Hashibutogarasu/utils/server';
import { locales } from '@/i18n/locales';
import { HeaderAccountMenu } from './HeaderAccountMenu';

const localeLabels: Record<(typeof locales)[number], { label: string; countryCode: CountryCode }> = {
  ja: { label: '日本語', countryCode: 'JP' },
  en: { label: 'English', countryCode: 'US' },
  cn: { label: '中文', countryCode: 'CN' },
};

/**
 * Site-wide header. Reads the session (verified remotely against
 * accounts.karasu256.com) to show an account menu when authenticated, or a
 * sign-in button when not, plus a language switcher.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  const rootUrl = await getRootAppUrl();
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
      <HeaderAccountMenu
        initialUser={
          sessionUser ? { uid: sessionUser.uid, iconUrl: sessionUser.image, displayName: sessionUser.name, email: sessionUser.email } : null
        }
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
