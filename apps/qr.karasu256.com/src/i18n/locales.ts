export const locales = ['ja'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';
