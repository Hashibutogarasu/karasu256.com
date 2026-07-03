"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { UserAvatar } from "@Hashibutogarasu/ui";

interface ProfileSectionProps {
  uid: string;
  email: string | null;
  iconUrl: string | null;
}

/**
 * Profile settings section. Displays the current user's avatar, email,
 * and a link to the accounts portal for full profile management.
 */
export function ProfileSection({ uid, email, iconUrl }: ProfileSectionProps) {
  const t = useTranslations();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "#";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("settings.profile.title")}</h1>

      <div className="flex items-center gap-4">
        <UserAvatar uid={uid} iconUrl={iconUrl} size={56} className="border border-border" />
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">{t("settings.profile.email")}</p>
          <p className="text-sm font-medium break-all">{email ?? uid}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("settings.profile.accountSettingsDescription")}
        </p>
        <a
          href={`${accountsUrl}/settings`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("settings.profile.accountSettings")}
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
