"use client";

import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import ja from "@/lib/i18n/locales/ja.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "ja",
    fallbackLng: "ja",
    resources: { ja: { translation: ja } },
    interpolation: { escapeValue: false },
  });
}

/** Provides the i18next instance to client components in the root app. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
