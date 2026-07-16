import type { Metadata } from 'next';
import { geistSans, geistMono, notoSansJP } from '@Hashibutogarasu/ui/fonts';
import './globals.css';

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
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
