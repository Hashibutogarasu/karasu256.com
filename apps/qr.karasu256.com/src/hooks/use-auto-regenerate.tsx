'use client';

import * as React from 'react';

const TICK_RESOLUTION_MS = 100;
const DEFAULT_INTERVAL_SECONDS = 30;

export interface AutoRegenerateContextValue {
  enabled: boolean;
  intervalSeconds: number;
  /** 0–1, elapsed fraction of the current interval. Always 0 when disabled. */
  progress: number;
  toggle: () => void;
  setIntervalSeconds: (seconds: number) => void;
}

const AutoRegenerateContext = React.createContext<AutoRegenerateContextValue | null>(null);

export function useAutoRegenerate(): AutoRegenerateContextValue {
  const ctx = React.useContext(AutoRegenerateContext);
  if (!ctx) throw new Error('useAutoRegenerate must be used within an AutoRegenerateProvider');
  return ctx;
}

export interface AutoRegenerateProviderProps {
  /** Called every time the interval elapses while enabled. */
  onTick: () => void | Promise<void>;
  children: React.ReactNode;
}

/**
 * Drives a client-side countdown that calls `onTick` once per
 * `intervalSeconds` while `enabled`, exposing the elapsed fraction as
 * `progress` for a progress bar. `onTick` is read from a ref so changing its
 * identity across renders doesn't restart the countdown.
 */
export function AutoRegenerateProvider({ onTick, children }: AutoRegenerateProviderProps) {
  const [enabled, setEnabled] = React.useState(false);
  const [intervalSeconds, setIntervalSecondsState] = React.useState(DEFAULT_INTERVAL_SECONDS);
  const [progress, setProgress] = React.useState(0);

  const onTickRef = React.useRef(onTick);
  onTickRef.current = onTick;

  const isTickingRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled) {
      setProgress(0);
      return;
    }

    let startedAt = Date.now();

    const id = setInterval(async () => {
      const elapsed = Date.now() - startedAt;
      const fraction = Math.min(1, elapsed / (intervalSeconds * 1000));
      setProgress(fraction);

      if (fraction >= 1 && !isTickingRef.current) {
        isTickingRef.current = true;
        await onTickRef.current();
        startedAt = Date.now();
        setProgress(0);
        isTickingRef.current = false;
      }
    }, TICK_RESOLUTION_MS);

    return () => clearInterval(id);
  }, [enabled, intervalSeconds]);

  const value = React.useMemo<AutoRegenerateContextValue>(
    () => ({
      enabled,
      intervalSeconds,
      progress,
      toggle: () => setEnabled((e) => !e),
      setIntervalSeconds: (seconds: number) => setIntervalSecondsState(seconds),
    }),
    [enabled, intervalSeconds, progress]
  );

  return <AutoRegenerateContext.Provider value={value}>{children}</AutoRegenerateContext.Provider>;
}
