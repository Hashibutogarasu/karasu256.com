'use client';

import { useCallback, useEffect, useState } from 'react';

export type DragAndDropAreaId = 'sidebar' | 'left-pane' | 'center-pane' | 'right-pane';

interface DragAndDropLayout {
  placements: Record<string, DragAndDropAreaId>;
  heights: Record<string, number>;
}

const STORAGE_KEY = 'karasu256-home-dnd-placement';

/**
 * Persists the home page's drag-and-drop layout to the browser's
 * `localStorage` under a single key — both where draggable components have
 * been dropped (keyed by the dragged component's own id) and each area's
 * manually resized height (keyed by area id). Hydrates from storage on
 * mount and restores the same layout on reload.
 */
export function useDragAndDropPlacement(defaultLayout: DragAndDropLayout = { placements: {}, heights: {} }) {
  const [layout, setLayout] = useState<DragAndDropLayout>(defaultLayout);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setLayout({ placements: parsed.placements ?? defaultLayout.placements, heights: parsed.heights ?? defaultLayout.heights });
    } catch {
      setLayout(defaultLayout);
    }
  }, []);

  const setPlacement = useCallback((componentKey: string, areaId: DragAndDropAreaId) => {
    setLayout((prev) => {
      const next = { ...prev, placements: { ...prev.placements, [componentKey]: areaId } };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setHeights = useCallback((heights: Record<string, number>) => {
    setLayout((prev) => {
      const next = { ...prev, heights };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { placements: layout.placements, setPlacement, heights: layout.heights, setHeights };
}
