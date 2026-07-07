'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MenuItem, TextInputMenuItem, ScrollableSubMenu } from '@Hashibutogarasu/ui';

const PRESET_STEP_SECONDS = 10;
const INITIAL_PRESET_COUNT = 10;

export interface IntervalMenuProps {
  intervalSeconds: number;
  onSelect: (seconds: number) => void;
}

/**
 * The "interval" submenu: a custom-value input pinned to the top, and an
 * infinitely-growing list of preset values below it. All of the scrolling
 * container and load-more mechanics live in `ScrollableSubMenu`; this
 * component only owns interval-specific data — how many presets are loaded
 * so far and the custom input's value — and hands it off.
 */
export function IntervalMenu({ intervalSeconds, onSelect }: IntervalMenuProps) {
  const t = useTranslations('qr');
  const [customValue, setCustomValue] = React.useState(String(intervalSeconds));
  const [presetCount, setPresetCount] = React.useState(INITIAL_PRESET_COUNT);

  const handleCustomSubmit = (value: string) => {
    const seconds = Number(value);
    if (Number.isInteger(seconds) && seconds > 0) {
      onSelect(seconds);
    }
  };

  const presets = Array.from({ length: presetCount }, (_, i) => (i + 1) * PRESET_STEP_SECONDS);

  return (
    <ScrollableSubMenu
      trigger={t('interval.label')}
      onLoadMore={() => setPresetCount((count) => count + PRESET_STEP_SECONDS)}
      pinned={
        <TextInputMenuItem
          value={customValue}
          onChange={setCustomValue}
          onSubmit={handleCustomSubmit}
          placeholder={t('interval.customPlaceholder')}
          aria-label={t('interval.customPlaceholder')}
        />
      }
    >
      {presets.map((seconds) => (
        <MenuItem key={seconds} onClick={() => onSelect(seconds)} className="hover:bg-accent hover:text-accent-foreground">
          {t('interval.seconds', { seconds })}
        </MenuItem>
      ))}
    </ScrollableSubMenu>
  );
}
