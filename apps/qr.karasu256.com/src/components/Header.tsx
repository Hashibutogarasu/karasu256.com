import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  Header as UiHeader,
  AccountMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
  type CountryCode,
} from '@Hashibutogarasu/ui';
import { getRootAppUrl, signOutAction, setLocaleAction } from '@Hashibutogarasu/utils/server';
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
      navItems={
        <NavigationMenuItem>
          <NavigationMenuLink render={<Link href="/history" />} className={navigationMenuTriggerStyle()}>
            {t('history')}
          </NavigationMenuLink>
        </NavigationMenuItem>
      }
      locales={localeLabels}
      currentLocale={currentLocale}
      onLocaleChange={setLocaleAction}
    >
      <AccountMenu
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
