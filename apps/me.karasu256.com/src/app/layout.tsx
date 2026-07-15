import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hashibutogarasu',
  description: 'Hashibutogarasuのポートフォリオサイトです。',
  icons: {
    icon: '/icon_64.png',
    apple: '/icon_64.png',
  },
  openGraph: {
    title: 'Hashibutogarasu',
    description: 'Hashibutogarasuのポートフォリオサイトです。',
    images: [
      {
        url: '/images/icon_64.png',
        width: 300,
        height: 300,
        alt: 'Hashibutogarasu',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hashibutogarasu',
    description: 'Hashibutogarasuのポートフォリオサイトです。',
    images: ['/images/icon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
