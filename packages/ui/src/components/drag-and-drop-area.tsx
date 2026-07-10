'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { useDragAndDrop, type DragPayload } from './drag-and-drop-context';

export interface DragAndDropAreaProps {
  id: string;
  children?: React.ReactNode;
  onDrop?: (payload: DragPayload) => void;
  className?: string;
  /** Set when this area already holds a dropped item, hiding the empty-state dashed border/faint content. */
  filled?: boolean;
  /** Minimum height, in pixels, the bottom-edge resize handle can shrink this area to. */
  minHeight?: number;
}

/**
 * A rounded (32px), dashed drop zone that centers `children`. Empty areas
 * stay faint at rest; only the specific area currently hovered by an active
 * drag fades in to a brighter border/background and full-opacity content —
 * sibling areas that aren't hovered stay faint even while a drag is in
 * progress elsewhere. While the enclosing `DragAndDropProvider` is
 * `disabled`, an empty area's dashed border and placeholder content fade
 * out entirely, since dropping isn't possible. An area already holding a
 * dropped item (`filled`) stretches `children` to fill its exact size and
 * always stays fully visible regardless of the empty-state fade, so the
 * item itself takes on the container's shape instead of floating small
 * inside it. While a drag is active it pushes its own geometry (and
 * `onDrop`) into the enclosing `DragAndDropProvider` on pointer-enter so the
 * floating ghost can morph to match its shape — the dragged item itself
 * never references this component. While empty, its bottom edge is also a
 * resize handle: dragging it persists a freely chosen height for that
 * state via the enclosing `DragAndDropProvider`'s height map, keyed by this
 * area's own `id` — no per-area wiring is needed from the caller.
 */
export function DragAndDropArea({ id, children, onDrop, className, filled, minHeight = 80 }: DragAndDropAreaProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { isDragging, disabled, hoveredAreaId, registerHover, clearHover, heights, setAreaHeight } = useDragAndDrop();
  const isHovered = hoveredAreaId === id;
  const height = heights[id];

  function handlePointerEnter() {
    if (!isDragging || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const borderRadius = getComputedStyle(ref.current).borderRadius;
    registerHover({ id, rect, borderRadius, onDrop });
  }

  function handlePointerLeave() {
    clearHover(id);
  }

  function handleResizePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (filled || !ref.current) return;
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = ref.current.getBoundingClientRect().height;

    function handleResizeMove(moveEvent: PointerEvent) {
      setAreaHeight(id, Math.max(minHeight, startHeight + (moveEvent.clientY - startY)));
    }

    function handleResizeUp() {
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeUp);
    }

    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeUp);
  }

  return (
    <div
      ref={ref}
      data-slot="drag-and-drop-area"
      data-hovered={isHovered ? '' : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={!filled && height !== undefined ? { height, alignSelf: 'start' } : undefined}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-[32px] transition-colors duration-200',
        filled ? 'border-2 border-transparent' : cn('border-2 border-dashed p-6', disabled ? 'border-foreground/0' : 'border-foreground/15'),
        'data-hovered:border-foreground/60 data-hovered:bg-foreground/5',
        className
      )}
    >
      <div
        className={cn(
          'transition-opacity duration-200',
          filled ? 'h-full w-full' : undefined,
          filled ? 'opacity-100' : disabled ? 'opacity-0' : isHovered ? 'opacity-100' : 'opacity-40'
        )}
      >
        {children}
      </div>
      {!filled && <div onPointerDown={handleResizePointerDown} className="absolute inset-x-0 bottom-0 h-2 cursor-row-resize touch-none" />}
    </div>
  );
}
