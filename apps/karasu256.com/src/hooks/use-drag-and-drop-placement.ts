'use client';

import { useCallback, useEffect, useState } from 'react';

export type DragAndDropAreaId = 'sidebar' | 'left-pane' | 'center-pane' | 'right-pane';

const STORAGE_KEY = 'karasu256-home-dnd-placement';

/**
 * Persists where draggable components on the home page have been dropped,
 * keyed by the dragged component's own id, to the browser's `localStorage`.
 * Hydrates from storage on mount and restores the same layout on reload.
 */
export function useDragAndDropPlacement() {
  const [placements, setPlacements] = useState<Record<string, DragAndDropAreaId>>({});

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setPlacements(JSON.parse(raw));
    } catch {
      setPlacements({});
    }
  }, []);

  const setPlacement = useCallback((componentKey: string, areaId: DragAndDropAreaId) => {
    setPlacements((prev) => {
      const next = { ...prev, [componentKey]: areaId };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { placements, setPlacement };
}
