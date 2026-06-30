"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  Input,
  Label,
} from "@Hashibutogarasu/ui";
import { createApiKey, type ApiKeyCreated } from "@/lib/api/developer";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onCreated: (_key: ApiKeyCreated) => void;
}

/**
 * Dialog for creating a new API key. Shows the raw key once after creation
 * and never again.
 */
export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateApiKeyDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleClose() {
    onOpenChange(false);
    setName("");
    setCreatedKey(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createApiKey(name.trim());
      setCreatedKey(result);
      onCreated(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md w-full p-6 space-y-4">
          <DialogTitle>{t("settings.developer.createKey")}</DialogTitle>

          {!createdKey ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">{t("settings.developer.dialog.keyName")}</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose
                  render={
                    <Button type="button" variant="ghost" onClick={handleClose}>
                      {t("settings.developer.dialog.cancel")}
                    </Button>
                  }
                />
                <Button type="submit" disabled={loading || !name.trim()}>
                  {t("settings.developer.dialog.create")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.developer.dialog.keyNotice")}
              </p>
              <Input readOnly value={createdKey.key} className="font-mono text-xs" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCopy}>
                  {copied
                    ? "✓"
                    : t("settings.developer.dialog.copyKey")}
                </Button>
                <Button onClick={handleClose}>
                  {t("settings.developer.dialog.done")}
                </Button>
              </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
