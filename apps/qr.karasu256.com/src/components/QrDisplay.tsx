'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { R2Image, Button, ProgressBar } from '@Hashibutogarasu/ui';
import type { QrData } from '@/lib/qr';
import { AutoRegenerateProvider, useAutoRegenerate } from '@/hooks/use-auto-regenerate';
import { QrSettingsMenu } from './QrSettingsMenu';

export interface QrDisplayProps {
  initialQr: QrData;
}

/** Displays the current QR code and lets the caller regenerate it via the `/api/qr` route, manually or on an auto-regenerate interval. */
export default function QrDisplay({ initialQr }: QrDisplayProps) {
  const [qr, setQr] = useState(initialQr);
  const [isPending, startTransition] = useTransition();

  const regenerate = async () => {
    const res = await fetch('/api/qr', { method: 'POST' });
    if (res.ok) setQr(await res.json());
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
