/**
 * Locale codes supported across the monorepo's apps. Not every app supports
 * every locale — check each app's own `next-intl` routing config (or its
 * `messages/` directory) for the subset it actually serves.
 */
export const locales = ['ja', 'en', 'cn'] as const;

export type Locale = (typeof locales)[number];
