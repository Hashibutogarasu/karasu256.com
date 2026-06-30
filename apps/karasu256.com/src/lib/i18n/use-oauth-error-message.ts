"use client";

import { useTranslation } from "react-i18next";

/**
 * Returns a function that translates an OAuth error code into a localized
 * message. Unknown codes fall back to the raw code string.
 */
export function useOAuthErrorMessage() {
  const { t } = useTranslation();
  return (code: string) =>
    t(`oauth.errors.${code}`, { defaultValue: code });
}
