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

/**
 * The contents of the "interval" submenu: a custom-value input pinned to the
 * top, and an infinitely-growing list of preset values below it. The
 * scrolling ancestor for the preset list's `IntersectionObserver` is
 * `MenuSubContent`'s own `overflow-y-auto` popup element, found via
 * `closest()`, since `MenuSubContent` is a plain function component with no
 * forwarded ref to grab directly.
 *
 * `IntersectionObserver` only fires when the sentinel's intersection with
 * `root` *crosses* the threshold, not merely while it remains intersecting.
 * Right after the popup opens, the preset list is shorter than the popup, so
 * the sentinel is already visible and stays that way after the first batch
 * is appended — no further crossing ever happens, so the callback silently
 * stops firing forever even though the popup still has room to grow.
 * Re-registering the same observer on the sentinel after every batch forces
 * a fresh notification for its current intersection state (per spec, a new
 * `observe()` call always reports the current state), which keeps the list
 * growing until the sentinel genuinely leaves `root`'s visible bounds — at
 * which point real scrolling takes over. Deferring to the observer (rather
 * than measuring `getBoundingClientRect` synchronously) also avoids racing
 * the popup's own async reposition/resize logic while the list grows.
 */
export function IntervalMenu({ intervalSeconds, onSelect }: IntervalMenuProps) {
  const t = useTranslations('qr');
  const [customValue, setCustomValue] = React.useState(String(intervalSeconds));
  const [presetCount, setPresetCount] = React.useState(INITIAL_PRESET_COUNT);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const root = sentinel.closest<HTMLElement>('[data-slot="dropdown-menu-sub-content"]');

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPresetCount((count) => count + PRESET_STEP_SECONDS);
        }
      },
      { root }
    );
    observerRef.current = observer;
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    const observer = observerRef.current;
    if (!sentinel || !observer) return;

    observer.unobserve(sentinel);
    observer.observe(sentinel);
  }, [presetCount]);

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
        <MenuItem key={seconds} onClick={() => onSelect(seconds)} className="hover:bg-accent hover:text-accent-foreground">
          {t('interval.seconds', { seconds })}
        </MenuItem>
      ))}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
    </>
  );
}
