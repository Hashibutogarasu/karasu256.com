"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Button, DeleteIconButton, SettingsItem } from "@Hashibutogarasu/ui";
import type { OAuthClientSummary, SectionMeta } from "@/lib/api/developer";

interface OAuthClientRowProps {
  client: OAuthClientSummary;
  sections: SectionMeta[];
  onEdit: (client: OAuthClientSummary) => void;
  onDelete: (id: string) => void;
}

/**
 * Displays a single OAuth client row with icon, name, callback URIs,
 * permission badges, an edit button, and a delete button.
 */
export function OAuthClientRow({ client, sections, onEdit, onDelete }: OAuthClientRowProps) {
  const { t } = useTranslation();

  const grantedSections = sections.filter(
    (s) =>
      (client.permissions & s.readMask) !== 0 ||
      (client.permissions & s.writeMask) !== 0,
  );

  return (
    <SettingsItem className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {client.iconUrl && (
          <Image
            src={client.iconUrl}
            alt=""
            width={32}
            height={32}
            className="rounded size-8 shrink-0 object-cover"
          />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium truncate">{client.name}</p>
          <div className="space-y-0.5">
            {client.callbackUris.map((uri) => (
              <p key={uri} className="text-xs text-muted-foreground truncate font-mono">
                {uri}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {grantedSections.map((s) => {
              const hasRead = (client.permissions & s.readMask) !== 0;
              const hasWrite = (client.permissions & s.writeMask) !== 0;
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
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          aria-label={t("settings.developer.edit")}
          onClick={() => onEdit(client)}
        >
          <Pencil className="size-4" />
        </Button>
        <DeleteIconButton
          size="icon"
          aria-label={t("settings.developer.delete")}
          onClick={() => onDelete(client.id)}
        />
      </div>
    </SettingsItem>
  );
}
