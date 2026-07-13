import React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_JP } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { PopUpMenuProvider, SessionProvider } from '@Hashibutogarasu/ui';
import { getSessionUser } from '@Hashibutogarasu/utils/server';
import './globals.css';
import Header from '@/components/Header';
import { authClient } from '@/lib/auth/client';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** CJK fallback so ja/cn glyphs render consistently with the Geist Latin text instead of the OS default font. */
const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-jp',
  subsets: ['latin'],
});

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
  const initialUser = sessionUser
    ? { uid: sessionUser.uid, iconUrl: sessionUser.image, displayName: sessionUser.name, email: sessionUser.email }
    : null;

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased" style={{ '--sidebar-top': '3rem' } as React.CSSProperties}>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider authClient={authClient} initialUser={initialUser}>
            <PopUpMenuProvider>
              <Header />
              <main className="flex-1 flex flex-col">{children}</main>
            </PopUpMenuProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
