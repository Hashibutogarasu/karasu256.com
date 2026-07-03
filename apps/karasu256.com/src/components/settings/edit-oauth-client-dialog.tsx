'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  FileUploadButton,
  Input,
  Label,
  R2Image,
} from '@Hashibutogarasu/ui';
import { updateOAuthClient, type OAuthClientSummary, type SectionMeta } from '@/lib/api/developer';
import { useImageUpload } from '@Hashibutogarasu/utils/client';

interface EditOAuthClientDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  client: OAuthClientSummary;
  sections: SectionMeta[];
  onUpdated: (_client: OAuthClientSummary) => void;
}

/**
 * Dialog for editing an existing OAuth client. Updates name, callback URIs,
 * icon, and permissions. The client secret cannot be changed here.
 */
export function EditOAuthClientDialog({ open, onOpenChange, client, sections, onUpdated }: EditOAuthClientDialogProps) {
  const t = useTranslations();
  const { uploading, upload } = useImageUpload();

  const [name, setName] = useState(client.name);
  const [callbackUrisText, setCallbackUrisText] = useState(client.callbackUris.join('\n'));
  const [iconUrl, setIconUrl] = useState(client.iconUrl ?? '');
  const [iconPreview, setIconPreview] = useState(client.iconUrl ?? '');
  const [permissions, setPermissions] = useState(client.permissions);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(client.name);
      setCallbackUrisText(client.callbackUris.join('\n'));
      setIconUrl(client.iconUrl ?? '');
      setIconPreview(client.iconUrl ?? '');
      setPermissions(client.permissions);
    }
  }, [open, client]);

  function parseUris(text: string): string[] {
    return text
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
  }

  function toggleMask(mask: number) {
    setPermissions((prev) => ((prev & mask) !== 0 ? prev & ~mask : prev | mask));
  }

  async function handleFileSelected(file: File) {
    const url = await upload(file, `oauth/${client.id}/icon.png`);
    if (!url) return;
    setIconUrl(url);
    setIconPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uris = parseUris(callbackUrisText);
    if (uris.length === 0) return;
    setLoading(true);
    try {
      const updated = await updateOAuthClient(client.id, {
        name: name.trim(),
        callbackUris: uris,
        iconUrl: iconUrl.trim() || null,
        permissions,
      });
      onUpdated(updated);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const uris = parseUris(callbackUrisText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-lg w-full p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
          <DialogTitle>{t('settings.developer.editClient')}</DialogTitle>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-client-name">{t('settings.developer.dialog.clientName')}</Label>
              <Input id="edit-client-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-callback-uris">{t('settings.developer.dialog.callbackUris')}</Label>
              <textarea
                id="edit-callback-uris"
                value={callbackUrisText}
                onChange={(e) => setCallbackUrisText(e.target.value)}
                rows={3}
                placeholder="https://example.com/callback"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <p className="text-xs text-muted-foreground">{t('settings.developer.dialog.callbackUrisHelp')}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t('settings.developer.dialog.icon')}</Label>
              <div className="flex items-center gap-3">
                {iconPreview && <R2Image src={iconPreview} alt="" className="size-10 rounded object-cover border border-border" />}
                <FileUploadButton
                  label={t('settings.developer.dialog.upload')}
                  loadingLabel={t('settings.developer.dialog.uploading')}
                  loading={uploading}
                  accept="image/jpeg,image/png,image/webp"
                  onFileSelected={handleFileSelected}
                />
              </div>
            </div>

            {sections.length > 0 && (
              <div className="space-y-2">
                <Label>{t('settings.developer.dialog.permissions')}</Label>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {sections.map((s) => (
                    <div key={s.key} className="px-3 py-2 space-y-1">
                      <p className="text-sm font-medium">{t(s.labelKey)}</p>
                      {s.descriptionKey && <p className="text-xs text-muted-foreground">{t(s.descriptionKey)}</p>}
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-1.5 text-sm">
                          <Checkbox checked={(permissions & s.readMask) !== 0} onCheckedChange={() => toggleMask(s.readMask)} />
                          {t('settings.developer.dialog.read')}
                        </label>
                        <label className="flex items-center gap-1.5 text-sm">
                          <Checkbox checked={(permissions & s.writeMask) !== 0} onCheckedChange={() => toggleMask(s.writeMask)} />
                          {t('settings.developer.dialog.write')}
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
                  <Button type="button" variant="ghost">
                    {t('settings.developer.dialog.cancel')}
                  </Button>
                }
              />
              <Button type="submit" disabled={loading || !name.trim() || uris.length === 0}>
                {t('settings.developer.dialog.save')}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
