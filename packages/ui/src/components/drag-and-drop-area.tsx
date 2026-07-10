'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { useDragAndDrop, type DragPayload } from './drag-and-drop-context';

export interface DragAndDropAreaProps {
  id: string;
  children?: React.ReactNode;
  onDrop?: (payload: DragPayload) => void;
  className?: string;
}

/**
 * A rounded (5%), dashed drop zone that centers `children`. Its dashed
 * border fades in while any drag is active and highlights further while
 * directly hovered. While a drag is active it pushes its own geometry (and
 * `onDrop`) into the enclosing `DragAndDropProvider` on pointer-enter so the
 * floating ghost can morph to match its shape — the dragged item itself
 * never references this component.
 */
export function DragAndDropArea({ id, children, onDrop, className }: DragAndDropAreaProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { isDragging, hoveredAreaId, registerHover, clearHover } = useDragAndDrop();

  function handlePointerEnter() {
    if (!isDragging || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const borderRadius = getComputedStyle(ref.current).borderRadius;
    registerHover({ id, rect, borderRadius, onDrop });
  }

  function handlePointerLeave() {
    clearHover(id);
  }

  return (
    <div
      ref={ref}
      data-slot="drag-and-drop-area"
      data-dragging={isDragging ? '' : undefined}
      data-hovered={hoveredAreaId === id ? '' : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={cn(
        'flex items-center justify-center rounded-[5%] p-6',
        'border-2 border-dashed border-foreground/0 transition-colors duration-200',
        'data-dragging:border-foreground/25',
        'data-hovered:border-foreground/50 data-hovered:bg-foreground/5',
        className
      )}
    >
      {children}
    </div>
  );
}
