'use client';

import * as React from 'react';

const TICK_RESOLUTION_MS = 100;
const DEFAULT_INTERVAL_SECONDS = 30;

export interface AutoRegenerateContextValue {
  enabled: boolean;
  intervalSeconds: number;
  /** 0–1, remaining fraction of the current interval, counting down to 0. Always 0 when disabled. */
  remaining: number;
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
 * `intervalSeconds` while `enabled`, exposing the remaining fraction as
 * `remaining` for a countdown progress bar. `onTick` is read from a ref so
 * changing its identity across renders doesn't restart the countdown.
 */
export function AutoRegenerateProvider({ onTick, children }: AutoRegenerateProviderProps) {
  const [enabled, setEnabled] = React.useState(false);
  const [intervalSeconds, setIntervalSecondsState] = React.useState(DEFAULT_INTERVAL_SECONDS);
  const [remaining, setRemaining] = React.useState(0);

  const onTickRef = React.useRef(onTick);
  onTickRef.current = onTick;

  const isTickingRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled) {
      setRemaining(0);
      return;
    }

    let startedAt = Date.now();
    setRemaining(1);

    const id = setInterval(async () => {
      const elapsed = Date.now() - startedAt;
      const fraction = Math.min(1, elapsed / (intervalSeconds * 1000));
      setRemaining(1 - fraction);

      if (fraction >= 1 && !isTickingRef.current) {
        isTickingRef.current = true;
        await onTickRef.current();
        startedAt = Date.now();
        setRemaining(1);
        isTickingRef.current = false;
      }
    }, TICK_RESOLUTION_MS);

    return () => clearInterval(id);
  }, [enabled, intervalSeconds]);

  const value = React.useMemo<AutoRegenerateContextValue>(
    () => ({
      enabled,
      intervalSeconds,
      remaining,
      toggle: () => setEnabled((e) => !e),
      setIntervalSeconds: (seconds: number) => setIntervalSecondsState(seconds),
    }),
    [enabled, intervalSeconds, remaining]
  );

  return <AutoRegenerateContext.Provider value={value}>{children}</AutoRegenerateContext.Provider>;
}
