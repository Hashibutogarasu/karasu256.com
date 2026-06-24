"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  Input,
  Label,
} from "@Hashibutogarasu/ui";
import {
  createOAuthClient,
  type OAuthClientCreated,
  type SectionMeta,
} from "@/lib/api/developer";

interface CreateOAuthClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SectionMeta[];
  onCreated: (client: OAuthClientCreated) => void;
}

/**
 * Dialog for creating a new OAuth client. Handles icon upload to the image API,
 * permission bitmask construction, and displays the raw secret once after creation.
 */
export function CreateOAuthClientDialog({
  open,
  onOpenChange,
  sections,
  onCreated,
}: CreateOAuthClientDialogProps) {
  const { t } = useTranslation();
  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL ?? "";

  const [name, setName] = useState("");
  const [callbackUri, setCallbackUri] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [iconPreview, setIconPreview] = useState("");
  const [permissions, setPermissions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [created, setCreated] = useState<OAuthClientCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleMask(mask: number) {
    setPermissions((prev) => (prev & mask) !== 0 ? prev & ~mask : prev | mask);
  }

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${imageApiUrl}/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        setIconUrl(url);
        setIconPreview(URL.createObjectURL(file));
      }
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setName("");
    setCallbackUri("");
    setIconUrl("");
    setIconPreview("");
    setPermissions(0);
    setCreated(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createOAuthClient({
        name: name.trim(),
        callbackUri: callbackUri.trim(),
        iconUrl: iconUrl || undefined,
        permissions,
      });
      setCreated(result);
      onCreated(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.secret);
    setCopied(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-lg w-full p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
          <DialogTitle>{t("settings.developer.createClient")}</DialogTitle>

          {!created ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name">
                  {t("settings.developer.dialog.clientName")}
                </Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="callback-uri">
                  {t("settings.developer.dialog.callbackUri")}
                </Label>
                <Input
                  id="callback-uri"
                  type="url"
                  value={callbackUri}
                  onChange={(e) => setCallbackUri(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("settings.developer.dialog.icon")}</Label>
                <div className="flex items-center gap-3">
                  {iconPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconPreview}
                      alt=""
                      className="size-10 rounded object-cover border border-border"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload />
                    {uploading ? "…" : t("settings.developer.dialog.upload")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleIconChange}
                  />
                </div>
              </div>

              {sections.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("settings.developer.dialog.permissions")}</Label>
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {sections.map((s) => (
                      <div key={s.key} className="px-3 py-2 space-y-1">
                        <p className="text-sm font-medium">{t(s.labelKey)}</p>
                        {s.descriptionKey && (
                          <p className="text-xs text-muted-foreground">
                            {t(s.descriptionKey)}
                          </p>
                        )}
                        <div className="flex gap-4 mt-1">
                          <label className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={(permissions & s.readMask) !== 0}
                              onCheckedChange={() => toggleMask(s.readMask)}
                            />
                            {t("settings.developer.dialog.read")}
                          </label>
                          <label className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={(permissions & s.writeMask) !== 0}
                              onCheckedChange={() => toggleMask(s.writeMask)}
                            />
                            {t("settings.developer.dialog.write")}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <DialogClose
                  render={
                    <Button type="button" variant="ghost" onClick={handleClose}>
                      {t("settings.developer.dialog.cancel")}
                    </Button>
                  }
                />
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || !callbackUri.trim()}
                >
                  {t("settings.developer.dialog.create")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.developer.dialog.secretNotice")}
              </p>
              <Input readOnly value={created.secret} className="font-mono text-xs" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCopy}>
                  {copied ? "✓" : t("settings.developer.dialog.copySecret")}
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
