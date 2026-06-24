"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Button } from "@Hashibutogarasu/ui";
import type { OAuthClientSummary, SectionMeta } from "@/lib/api/developer";

interface OAuthClientRowProps {
  client: OAuthClientSummary;
  sections: SectionMeta[];
  onDelete: (id: string) => void;
}

/**
 * Displays a single OAuth client row with icon, name, callback URI,
 * permission badges, and a delete button.
 */
export function OAuthClientRow({ client, sections, onDelete }: OAuthClientRowProps) {
  const { t } = useTranslation();

  const grantedSections = sections.filter(
    (s) =>
      (client.permissions & s.readMask) !== 0 ||
      (client.permissions & s.writeMask) !== 0,
  );

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
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
          <p className="text-xs text-muted-foreground truncate">{client.callbackUri}</p>
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
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("settings.developer.delete")}
        onClick={() => onDelete(client.id)}
        className="shrink-0"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
