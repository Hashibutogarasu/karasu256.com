"use client";

import { useTranslation } from "react-i18next";
import { DeleteIconButton } from "@Hashibutogarasu/ui";
import type { ApiKeySummary } from "@/lib/api/developer";

interface ApiKeyRowProps {
  apiKey: ApiKeySummary;
  onDelete: (id: string) => void;
}

/**
 * Displays a single API key row with prefix, creation date, last-used date,
 * and a delete button.
 */
export function ApiKeyRow({ apiKey, onDelete }: ApiKeyRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">{apiKey.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{apiKey.keyPrefix}…</p>
        <p className="text-xs text-muted-foreground">
          {t("settings.developer.created")}:{" "}
          {new Date(apiKey.createdAt).toLocaleDateString()}
          {" · "}
          {apiKey.lastUsedAt
            ? new Date(apiKey.lastUsedAt).toLocaleDateString()
            : t("settings.developer.neverUsed")}
        </p>
      </div>
      <DeleteIconButton
        size="icon"
        aria-label={t("settings.developer.delete")}
        onClick={() => onDelete(apiKey.id)}
      />
    </div>
  );
}
