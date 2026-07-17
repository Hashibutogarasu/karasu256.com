'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createId } from '@paralleldrive/cuid2';
import QRCode from 'qrcode';
import { R2Image, Button, ProgressBar } from '@Hashibutogarasu/ui';
import { apiFetch } from '@Hashibutogarasu/utils/client';
import type { QrData } from '@/lib/qr';
import { AutoRegenerateProvider, useAutoRegenerate } from '@/hooks/use-auto-regenerate';
import { QrSettingsMenu } from './QrSettingsMenu';

export interface QrDisplayProps {
  initialQr: QrData;
}

/**
 * Displays the current QR code and lets the caller regenerate it, manually
 * or on an auto-regenerate interval. Regeneration is client-predicted: the
 * new content id is created and rendered locally as a data URL right away,
 * while `/api/qr` encodes that same content and syncs it to R2 and Redis in
 * the background, swapping in the canonical URL once done. Sync responses
 * that arrive after a newer regeneration started are dropped so a slow
 * request can never overwrite a fresher QR.
 */
export default function QrDisplay({ initialQr }: QrDisplayProps) {
  const [qr, setQr] = useState(initialQr);
  const [isPending, startTransition] = useTransition();
  const latestContentRef = useRef(initialQr.content);

  const regenerate = async () => {
    const content = createId();
    latestContentRef.current = content;

    const dataUrl = await QRCode.toDataURL(content, { width: 512 });
    if (latestContentRef.current !== content) return;
    setQr({ content, url: dataUrl, createdAt: new Date().toISOString() });

    const res = await apiFetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return;

    const synced = (await res.json()) as QrData;
    if (latestContentRef.current === synced.content) setQr(synced);
  };

  return (
    <AutoRegenerateProvider onTick={regenerate}>
      <QrDisplayInner qr={qr} isPending={isPending} onRegenerate={() => startTransition(regenerate)} />
    </AutoRegenerateProvider>
  );
}

interface QrDisplayInnerProps {
  qr: QrData;
  isPending: boolean;
  onRegenerate: () => void;
}

function QrDisplayInner({ qr, isPending, onRegenerate }: QrDisplayInnerProps) {
  const t = useTranslations('qr');
  const { remaining } = useAutoRegenerate();

  return (
    <>
      <R2Image src={qr.url} alt={t('imageAlt')} className="size-64 md:size-96" />
      <div className="mt-4 w-64 md:w-96">
        <ProgressBar value={remaining} />
      </div>
      <div className="flex w-64 items-center justify-end gap-2 md:w-96">
        <Button onClick={onRegenerate} disabled={isPending} className="w-[90%]">
          {t('regenerate')}
        </Button>
        <QrSettingsMenu />
      </div>
    </>
  );
}
