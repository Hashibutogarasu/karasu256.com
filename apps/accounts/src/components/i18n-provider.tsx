"use client";

import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/lib/i18n/locales/en.json";
import ja from "@/lib/i18n/locales/ja.json";
import cn from "@/lib/i18n/locales/cn.json";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: "ja",
      resources: {
        en: { translation: en },
        ja: { translation: ja },
        cn: { translation: cn },
      },
      interpolation: { escapeValue: false },
    });
}

/**
 * Client-side wrapper that provides the i18next instance to the component tree.
 * Must wrap all components that call `useTranslation()`.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
