"use client";

import { useTranslation } from "react-i18next";
import { PasswordStrengthIndicator } from "./password-strength-indicator";

/**
 * Wraps {@link PasswordStrengthIndicator} with labels sourced from i18n.
 */
export function LocalizedPasswordStrengthIndicator({ password }: { password: string }) {
  const { t } = useTranslation();
  return (
    <PasswordStrengthIndicator
      password={password}
      labels={{
        weak: t("passwordStrength.weak"),
        fair: t("passwordStrength.fair"),
        good: t("passwordStrength.good"),
        strong: t("passwordStrength.strong"),
      }}
    />
  );
}
