import React from 'react';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { PopUpMenuProvider, SessionProvider } from '@Hashibutogarasu/ui';
import { geistSans, geistMono, notoSansJP } from '@Hashibutogarasu/ui/fonts';
import { getSessionUser } from '@Hashibutogarasu/utils/server';
import { FeatureFlagsProvider, getEdgeConfig } from '@Hashibutogarasu/flags/server';
import './globals.css';
import Header from '@/components/Header';
import { appFlagsSchema } from '@/lib/flags';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Metadata');
  const siteTitle = t('siteTitle');
  const siteDescription = t('siteDescription');

  return {
    metadataBase: new URL('https://karasu256.com'),
    title: { default: siteTitle, template: '%s — Karasu Lab' },
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: 'Karasu Lab',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: siteTitle,
      description: siteDescription,
    },
  };
}

/** Root layout with Geist fonts and full-height flex column. */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const sessionUser = await getSessionUser();
  const edgeConfig = await getEdgeConfig();
  const initialUser = sessionUser
    ? { uid: sessionUser.uid, iconUrl: sessionUser.image, displayName: sessionUser.name, email: sessionUser.email }
    : null;

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased" style={{ '--sidebar-top': '3rem' } as React.CSSProperties}>
        <NextIntlClientProvider messages={messages}>
          <FeatureFlagsProvider edgeConfig={edgeConfig} schema={appFlagsSchema}>
            <SessionProvider baseURL={process.env.NEXT_PUBLIC_ACCOUNTS_URL} initialUser={initialUser}>
              <PopUpMenuProvider>
                <Header />
                <main className="flex-1 flex flex-col">{children}</main>
              </PopUpMenuProvider>
            </SessionProvider>
          </FeatureFlagsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
