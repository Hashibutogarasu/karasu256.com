import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Header as UiHeader, AccountMenu, type CountryCode } from '@Hashibutogarasu/ui';
import { getSignInUrl, signOutAction, setLocaleAction } from '@Hashibutogarasu/utils/server';
import { locales } from '@/i18n/locales';

const localeLabels: Record<(typeof locales)[number], { label: string; countryCode: CountryCode }> = {
  ja: { label: '日本語', countryCode: 'JP' },
  en: { label: 'English', countryCode: 'US' },
  cn: { label: '中文', countryCode: 'CN' },
};

/**
 * Site-wide header. Shows an account menu (driven by the nearest
 * `SessionProvider`, see the root layout) when authenticated, or a sign-in
 * button when not, plus a language switcher.
 */
const Header = async () => {
  const signInUrl = await getSignInUrl(process.env.NEXT_PUBLIC_AUTH_URL);
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
        signInHref={signInUrl}
        settingsHref="/settings"
        onSignOut={signOutAction}
        labels={{ signIn: t('signIn'), settings: t('settings'), signOut: t('signOut') }}
        triggerAriaLabel={t('accountMenuLabel')}
      />
    </UiHeader>
  );
};

export default Header;
