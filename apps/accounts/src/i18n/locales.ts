export const locales = ["ja", "en", "cn"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ja";
