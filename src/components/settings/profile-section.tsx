"use client";

import { useTranslation } from "react-i18next";
import { Identicon } from "@Hashibutogarasu/ui";

interface ProfileSectionProps {
  uid: string;
  email: string | null;
}

/**
 * Profile settings section. Displays the current user's identicon, email,
 * and a link to the accounts portal for full profile management.
 */
export function ProfileSection({ uid, email }: ProfileSectionProps) {
  const { t } = useTranslation();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "#";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("settings.profile.title")}</h1>

      <div className="flex items-center gap-4">
        <Identicon value={uid} size={56} className="border border-border" />
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">{t("settings.profile.email")}</p>
          <p className="text-sm font-medium break-all">{email ?? uid}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("settings.profile.accountSettingsDescription")}
        </p>
        <a
          href={`${accountsUrl}/settings`}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          {t("settings.profile.accountSettings")} →
        </a>
      </div>
    </div>
  );
}
