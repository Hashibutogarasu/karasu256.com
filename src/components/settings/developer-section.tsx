"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, SettingsAccordion } from "@Hashibutogarasu/ui";
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

  async function handleDeleteClient(id: string) {
    await deleteOAuthClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleDeleteKey(id: string) {
    await deleteApiKey(id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
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
                onDelete={handleDeleteClient}
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
              <ApiKeyRow key={k.id} apiKey={k} onDelete={handleDeleteKey} />
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
    </div>
  );
}
