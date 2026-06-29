"use client";

import React from "react";
import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import en from "@/lib/i18n/locales/en/translation.json";
import ja from "@/lib/i18n/locales/ja/translation.json";
import cn from "@/lib/i18n/locales/cn/translation.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "ja",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      cn: { translation: cn },
    },
    interpolation: { escapeValue: false },
  });
}

/** Provides the i18next instance to client components in the root app. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
