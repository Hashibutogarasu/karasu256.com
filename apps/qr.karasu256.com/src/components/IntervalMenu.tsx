'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MenuItem, TextInputMenuItem } from '@Hashibutogarasu/ui';

const PRESET_STEP_SECONDS = 10;
const INITIAL_PRESET_COUNT = 10;

export interface IntervalMenuProps {
  intervalSeconds: number;
  onSelect: (seconds: number) => void;
}

/** The contents of the "interval" submenu: a custom-value input pinned to the top, and an infinitely-growing list of preset values below it. */
export function IntervalMenu({ intervalSeconds, onSelect }: IntervalMenuProps) {
  const t = useTranslations('qr');
  const [customValue, setCustomValue] = React.useState(String(intervalSeconds));
  const [presetCount, setPresetCount] = React.useState(INITIAL_PRESET_COUNT);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setPresetCount((count) => count + PRESET_STEP_SECONDS);
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleCustomSubmit = (value: string) => {
    const seconds = Number(value);
    if (Number.isInteger(seconds) && seconds > 0) {
      onSelect(seconds);
    }
  };

  const presets = Array.from({ length: presetCount }, (_, i) => (i + 1) * PRESET_STEP_SECONDS);

  return (
    <>
      <div className="sticky top-0 z-10 bg-popover">
        <TextInputMenuItem
          value={customValue}
          onChange={setCustomValue}
          onSubmit={handleCustomSubmit}
          placeholder={t('interval.customPlaceholder')}
          aria-label={t('interval.customPlaceholder')}
        />
      </div>
      {presets.map((seconds) => (
        <MenuItem key={seconds} onClick={() => onSelect(seconds)}>
          {t('interval.seconds', { seconds })}
        </MenuItem>
      ))}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
    </>
  );
}
