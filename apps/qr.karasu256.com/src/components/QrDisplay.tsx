'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { R2Image, Button } from '@Hashibutogarasu/ui';
import type { QrData } from '@/lib/qr';

export interface QrDisplayProps {
  initialQr: QrData;
}

/** Displays the current QR code and lets the caller regenerate it via the `/api/qr` route. */
export default function QrDisplay({ initialQr }: QrDisplayProps) {
  const [qr, setQr] = useState(initialQr);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('qr');

  const handleRegenerate = () => {
    startTransition(async () => {
      const res = await fetch('/api/qr', { method: 'POST' });
      if (res.ok) setQr(await res.json());
    });
  };

  return (
    <>
      <R2Image src={qr.url} alt={t('imageAlt')} className="size-64 md:size-96" />
      <Button onClick={handleRegenerate} disabled={isPending}>
        {t('regenerate')}
      </Button>
    </>
  );
}
