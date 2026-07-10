'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { useDragAndDrop } from './drag-and-drop-context';

export interface DraggableProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Minimum pointer travel, in pixels, before a pointer-down turns into a drag. */
  dragThreshold?: number;
}

/**
 * Makes `children` pickupable by pointer. A drag only actually begins once
 * the pointer has moved past `dragThreshold` from where it went down — a
 * stationary click/tap never calls `beginDrag`. Once started, it hands its
 * own content and geometry to the enclosing `DragAndDropProvider` and hides
 * its in-place rendering (`opacity: 0`) while the provider's floating ghost
 * shows the same content elsewhere — `Draggable` never imports or knows
 * about any specific drop target.
 */
export function Draggable({ id, children, className, disabled, dragThreshold = 4 }: DraggableProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { isDragging, activePayload, beginDrag } = useDragAndDrop();
  const isThisDragging = isDragging && activePayload?.id === id;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !event.isPrimary || event.button !== 0 || !ref.current) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const element = ref.current;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < dragThreshold) return;
      cleanup();

      const rect = element.getBoundingClientRect();
      const borderRadius = getComputedStyle(element).borderRadius;
      beginDrag(
        {
          id,
          content: children,
          originRect: rect,
          originBorderRadius: borderRadius,
          pointerOffsetX: startX - rect.left,
          pointerOffsetY: startY - rect.top,
        },
        moveEvent
      );
    }

    function handlePointerUp() {
      cleanup();
    }

    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      className={cn('cursor-grab touch-none select-none', className)}
      style={{ opacity: isThisDragging ? 0 : 1, pointerEvents: isThisDragging ? 'none' : undefined }}
    >
      {children}
    </div>
  );
}
