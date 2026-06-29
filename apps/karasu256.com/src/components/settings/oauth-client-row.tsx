"use client";

import Image from "next/image";
import { KeyRound, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SettingsItem,
} from "@Hashibutogarasu/ui";
import type { OAuthClientSummary, SectionMeta } from "@/lib/api/developer";

interface OAuthClientRowProps {
  client: OAuthClientSummary;
  sections: SectionMeta[];
  onTest: (client: OAuthClientSummary) => void;
  onEdit: (client: OAuthClientSummary) => void;
  onDelete: (id: string) => void;
  onRotateSecret: (client: OAuthClientSummary) => void;
}

/**
 * Displays a single OAuth client row with icon, name, callback URIs,
 * permission badges, a dedicated edit button, and a three-dot menu for
 * additional actions (test, delete).
 */
export function OAuthClientRow({ client, sections, onTest, onEdit, onDelete, onRotateSecret }: OAuthClientRowProps) {
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="ghost" aria-label={t("settings.developer.menu")}>
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuPortal>
            <DropdownMenuPositioner align="end" side="bottom" sideOffset={4}>
              <DropdownMenuPopup>
                <DropdownMenuItem onClick={() => onTest(client)}>
                  <Play className="size-4" />
                  {t("settings.developer.testClient")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRotateSecret(client)}>
                  <KeyRound className="size-4" />
                  {t("settings.developer.rotateSecret")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive hover:text-destructive"
                  onClick={() => onDelete(client.id)}
                >
                  <Trash2 className="size-4" />
                  {t("settings.developer.delete")}
                </DropdownMenuItem>
              </DropdownMenuPopup>
            </DropdownMenuPositioner>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </SettingsItem>
  );
}
