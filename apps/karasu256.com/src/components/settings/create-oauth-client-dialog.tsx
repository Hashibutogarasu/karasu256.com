'use client';

import React, { useState } from 'react';
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
import { createOAuthClient, type OAuthClientCreated, type SectionMeta } from '@/lib/api/developer';
import { useImageUpload } from '@Hashibutogarasu/utils/client';

interface CreateOAuthClientDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  sections: SectionMeta[];
  onCreated: (_client: OAuthClientCreated) => void;
}

/**
 * Dialog for creating a new OAuth client. Handles icon upload to the image API,
 * permission bitmask construction, and displays the raw secret once after creation.
 * Accepts multiple callback URIs, one per line.
 */
export function CreateOAuthClientDialog({ open, onOpenChange, sections, onCreated }: CreateOAuthClientDialogProps) {
  const t = useTranslations();
  const { uploading, upload } = useImageUpload();

  const [name, setName] = useState('');
  const [callbackUrisText, setCallbackUrisText] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [permissions, setPermissions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<OAuthClientCreated | null>(null);
  const [copied, setCopied] = useState(false);

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
    const url = await upload(file);
    if (!url) return;
    setIconUrl(url);
    setIconPreview(URL.createObjectURL(file));
  }

  function handleClose() {
    onOpenChange(false);
    setName('');
    setCallbackUrisText('');
    setIconUrl('');
    setIconPreview('');
    setPermissions(0);
    setCreated(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uris = parseUris(callbackUrisText);
    if (uris.length === 0) return;
    setLoading(true);
    try {
      const result = await createOAuthClient({
        name: name.trim(),
        callbackUris: uris,
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

  const uris = parseUris(callbackUrisText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-lg w-full p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
          <DialogTitle>{t('settings.developer.createClient')}</DialogTitle>

          {!created ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name">{t('settings.developer.dialog.clientName')}</Label>
                <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="callback-uris">{t('settings.developer.dialog.callbackUris')}</Label>
                <textarea
                  id="callback-uris"
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
                    <Button type="button" variant="ghost" onClick={handleClose}>
                      {t('settings.developer.dialog.cancel')}
                    </Button>
                  }
                />
                <Button type="submit" disabled={loading || !name.trim() || uris.length === 0}>
                  {t('settings.developer.dialog.create')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('settings.developer.dialog.secretNotice')}</p>
              <Input readOnly value={created.secret} className="font-mono text-xs" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCopy}>
                  {copied ? '✓' : t('settings.developer.dialog.copySecret')}
                </Button>
                <Button onClick={handleClose}>{t('settings.developer.dialog.done')}</Button>
              </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
