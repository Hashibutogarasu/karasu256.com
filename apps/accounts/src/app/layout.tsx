import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { Toaster } from "@Hashibutogarasu/ui";

config.autoAddCss = false;

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  const siteTitle = t("siteTitle");
  const siteDescription = t("siteDescription");

  return {
    metadataBase: new URL("https://accounts.karasu256.com"),
    title: { default: siteTitle, template: "%s — Karasu Lab" },
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: "Karasu Lab",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: siteTitle,
      description: siteDescription,
    },
  };
}

/** Root layout — applies Geist fonts and full-height flex column. */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
