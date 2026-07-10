'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { useDragAndDrop } from './drag-and-drop-context';

export interface DraggableProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Makes `children` pickupable by pointer. On `pointerdown` it hands its own
 * content and geometry to the enclosing `DragAndDropProvider` and hides its
 * in-place rendering (`opacity: 0`) while the provider's floating ghost
 * shows the same content elsewhere — `Draggable` never imports or knows
 * about any specific drop target.
 */
export function Draggable({ id, children, className, disabled }: DraggableProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { isDragging, activePayload, beginDrag } = useDragAndDrop();
  const isThisDragging = isDragging && activePayload?.id === id;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !event.isPrimary || event.button !== 0 || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const borderRadius = getComputedStyle(ref.current).borderRadius;

    beginDrag(
      {
        id,
        content: children,
        originRect: rect,
        originBorderRadius: borderRadius,
        pointerOffsetX: event.clientX - rect.left,
        pointerOffsetY: event.clientY - rect.top,
      },
      event
    );

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
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
