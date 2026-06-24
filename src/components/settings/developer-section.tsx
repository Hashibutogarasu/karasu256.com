"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, ConfirmDialog, SettingsAccordion } from "@Hashibutogarasu/ui";
import {
  deleteApiKey,
  deleteOAuthClient,
  getPermissionSections,
  listApiKeys,
  listOAuthClients,
  type ApiKeyCreated,
  type ApiKeySummary,
  type OAuthClientCreated,
  type OAuthClientSummary,
  type SectionMeta,
} from "@/lib/api/developer";
import { ApiKeyRow } from "./api-key-row";
import { OAuthClientRow } from "./oauth-client-row";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { CreateOAuthClientDialog } from "./create-oauth-client-dialog";

type PendingDelete =
  | { type: "client"; id: string; name: string }
  | { type: "key"; id: string; name: string };

/**
 * Developer settings section. Manages OAuth clients and API keys with
 * collapsible lists and creation dialogs.
 */
export function DeveloperSection() {
  const { t } = useTranslation();

  const [clients, setClients] = useState<OAuthClientSummary[]>([]);
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  useEffect(() => {
    void Promise.all([
      listOAuthClients().then(setClients),
      listApiKeys().then(setKeys),
      getPermissionSections().then(setSections),
    ]);
  }, []);

  function handleClientCreated(client: OAuthClientCreated) {
    setClients((prev) => [client, ...prev]);
  }

  function handleKeyCreated(key: ApiKeyCreated) {
    setKeys((prev) => [key, ...prev]);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "client") {
      await deleteOAuthClient(pendingDelete.id);
      setClients((prev) => prev.filter((c) => c.id !== pendingDelete.id));
    } else {
      await deleteApiKey(pendingDelete.id);
      setKeys((prev) => prev.filter((k) => k.id !== pendingDelete.id));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("settings.developer.title")}</h1>

      <SettingsAccordion
        title={t("settings.developer.oauthClients")}
        action={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("settings.developer.createClient")}
            onClick={() => setClientDialogOpen(true)}
          >
            <Plus />
          </Button>
        }
      >
        <div className="mt-2 space-y-2">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("settings.developer.noClients")}
            </p>
          ) : (
            clients.map((c) => (
              <OAuthClientRow
                key={c.id}
                client={c}
                sections={sections}
                onDelete={(id) =>
                  setPendingDelete({ type: "client", id, name: c.name })
                }
              />
            ))
          )}
        </div>
      </SettingsAccordion>

      <SettingsAccordion
        title={t("settings.developer.apiKeys")}
        action={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("settings.developer.createKey")}
            onClick={() => setKeyDialogOpen(true)}
          >
            <Plus />
          </Button>
        }
      >
        <div className="mt-2 space-y-2">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("settings.developer.noKeys")}
            </p>
          ) : (
            keys.map((k) => (
              <ApiKeyRow
                key={k.id}
                apiKey={k}
                onDelete={(id) =>
                  setPendingDelete({ type: "key", id, name: k.name })
                }
              />
            ))
          )}
        </div>
      </SettingsAccordion>

      <CreateOAuthClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        sections={sections}
        onCreated={handleClientCreated}
      />
      <CreateApiKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        onCreated={handleKeyCreated}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title={t("settings.developer.deleteConfirm.title")}
        description={t("settings.developer.deleteConfirm.description", {
          name: pendingDelete?.name ?? "",
        })}
        confirmLabel={t("settings.developer.delete")}
        cancelLabel={t("settings.developer.deleteConfirm.cancel")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
