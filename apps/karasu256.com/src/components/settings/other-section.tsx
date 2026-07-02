"use client";

import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  ConfirmDialog,
  R2Image,
  SettingsAccordion,
  SettingsItem,
} from "@Hashibutogarasu/ui";
import {
  listAuthorizedApps,
  revokeAuthorizedApp,
  type AuthorizedAppSummary,
} from "@/lib/api/other";
import { getPermissionSections, type SectionMeta } from "@/lib/api/developer";

/**
 * Other settings section. Currently contains the authorized apps list, where
 * users can view and revoke OAuth clients they have previously authorized.
 */
export function OtherSection() {
  const { t } = useTranslation();

  const [apps, setApps] = useState<AuthorizedAppSummary[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [pendingRevoke, setPendingRevoke] = useState<AuthorizedAppSummary | null>(null);

  useEffect(() => {
    void Promise.all([
      listAuthorizedApps().then(setApps),
      getPermissionSections().then(setSections),
    ]);
  }, []);

  async function confirmRevoke() {
    if (!pendingRevoke) return;
    await revokeAuthorizedApp(pendingRevoke.clientId);
    setApps((prev) => prev.filter((a) => a.clientId !== pendingRevoke.clientId));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("settings.other.title")}</h1>

      <SettingsAccordion title={t("settings.other.authorizedApps")}>
        <div className="mt-2 space-y-2">
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("settings.other.noAuthorizedApps")}
            </p>
          ) : (
            apps.map((app) => (
              <AuthorizedAppRow
                key={app.clientId}
                app={app}
                sections={sections}
                onRevoke={() => setPendingRevoke(app)}
              />
            ))
          )}
        </div>
      </SettingsAccordion>

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
        title={t("settings.other.revokeConfirm.title")}
        description={t("settings.other.revokeConfirm.description", {
          name: pendingRevoke?.name ?? "",
        })}
        confirmLabel={t("settings.other.revoke")}
        cancelLabel={t("settings.other.revokeConfirm.cancel")}
        onConfirm={confirmRevoke}
      />
    </div>
  );
}

interface AuthorizedAppRowProps {
  app: AuthorizedAppSummary;
  sections: SectionMeta[];
  onRevoke: () => void;
}

function AuthorizedAppRow({ app, sections, onRevoke }: AuthorizedAppRowProps) {
  const { t } = useTranslation();

  const grantedSections = sections.filter(
    (s) => (app.permissions & s.readMask) !== 0 || (app.permissions & s.writeMask) !== 0,
  );

  return (
    <SettingsItem className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {app.iconUrl && (
          <R2Image
            src={app.iconUrl}
            alt=""
            width={32}
            height={32}
            className="rounded size-8 shrink-0 object-cover"
          />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium truncate">{app.name}</p>
          {app.lastUsedAt && (
            <p className="text-xs text-muted-foreground">
              {t("settings.other.lastUsed")}:{" "}
              {new Date(app.lastUsedAt).toLocaleDateString()}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {grantedSections.map((s) => {
              const hasRead = (app.permissions & s.readMask) !== 0;
              const hasWrite = (app.permissions & s.writeMask) !== 0;
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
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-destructive hover:text-destructive"
        onClick={onRevoke}
      >
        <Ban className="size-4" />
        {t("settings.other.revoke")}
      </Button>
    </SettingsItem>
  );
}
