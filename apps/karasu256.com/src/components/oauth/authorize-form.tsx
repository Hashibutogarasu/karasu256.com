"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, R2Image } from "@Hashibutogarasu/ui";

interface SectionMeta {
  key: string;
  labelKey: string;
  descriptionKey?: string;
  readMask: number;
  writeMask: number;
}

interface AuthorizeFormProps {
  client: {
    id: string;
    name: string;
    iconUrl: string | null;
  };
  redirectUri: string;
  permissions: number;
  state: string | undefined;
  sections: SectionMeta[];
}

/**
 * Displays the OAuth consent form. The user can approve or deny the
 * authorization request. On approval, posts to /api/oauth/authorize and
 * navigates to the returned redirectUrl. On denial, navigates directly to
 * the redirect_uri with error=access_denied.
 */
export function AuthorizeForm({
  client,
  redirectUri,
  permissions,
  state,
  sections,
}: AuthorizeFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const grantedSections = sections.filter(
    (s) => (permissions & s.readMask) !== 0 || (permissions & s.writeMask) !== 0,
  );

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          redirectUri,
          permissions,
          state,
          approved: true,
        }),
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { redirectUrl } = (await res.json()) as { redirectUrl: string };
      window.location.href = redirectUrl;
    } catch {
      setLoading(false);
    }
  }

  function handleDeny() {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state !== undefined) url.searchParams.set("state", state);
    window.location.href = url.toString();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-lg border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          {client.iconUrl && (
            <R2Image
              src={client.iconUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded object-cover shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-semibold">{client.name}</p>
            <p className="text-xs text-muted-foreground">{t("oauth.authorize.subtitle")}</p>
          </div>
        </div>

        {grantedSections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {t("oauth.authorize.permissionsLabel")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {grantedSections.map((s) => {
                const hasRead = (permissions & s.readMask) !== 0;
                const hasWrite = (permissions & s.writeMask) !== 0;
                const suffix = hasRead && hasWrite ? " R/W" : hasWrite ? " W" : " R";
                return (
                  <Badge key={s.key} variant="secondary" className="text-xs">
                    {t(s.labelKey)}
                    {suffix}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleDeny}
            disabled={loading}
          >
            {t("oauth.authorize.deny")}
          </Button>
          <Button
            className="flex-1"
            onClick={handleApprove}
            disabled={loading}
          >
            {t("oauth.authorize.approve")}
          </Button>
        </div>
      </div>
    </div>
  );
}
