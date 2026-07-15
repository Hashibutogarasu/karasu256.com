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
  /** Which side shows a width resize handle; omit for none. */
  resizeEdge?: 'left' | 'right';
  /** Minimum width, in pixels, the side resize handle can shrink this area to. */
  minWidth?: number;
}

/**
 * Direction-agnostic drag handle: measures pointer movement along whichever
 * `axis` it's given and reports the resulting size via `onResize`, without
 * knowing whether it visually represents a top, bottom, left, or right edge
 * — that's purely a matter of the `className` positioning its caller passes
 * in, and of the `sign` the caller picks to say whether dragging toward
 * increasing screen coordinates grows or shrinks the element.
 */
interface ResizeHandleProps {
  /** Pointer axis this handle measures drag distance along. */
  axis: 'x' | 'y';
  /** Multiplies the raw pointer delta before adding it to the starting size — pass +1 when dragging toward increasing coordinates should grow the element, -1 when it should shrink it. */
  sign: 1 | -1;
  min: number;
  disabled?: boolean;
  getSize: () => number;
  onResize: (size: number) => void;
  className?: string;
}

function ResizeHandle({ axis, sign, min, disabled, getSize, onResize, className }: ResizeHandleProps) {
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    event.stopPropagation();
    const start = axis === 'x' ? event.clientX : event.clientY;
    const startSize = getSize();

    function handleMove(moveEvent: PointerEvent) {
      const current = axis === 'x' ? moveEvent.clientX : moveEvent.clientY;
      onResize(Math.max(min, startSize + sign * (current - start)));
    }

    function handleUp() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      className={cn(
        'group/resize absolute flex touch-none items-center justify-center',
        axis === 'x' ? 'inset-y-0 w-2 pointer-coarse:w-6' : 'inset-x-0 h-2 pointer-coarse:h-6',
        disabled ? 'pointer-events-none cursor-default' : axis === 'x' ? 'cursor-col-resize' : 'cursor-row-resize',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-foreground/0 transition-colors duration-200',
          axis === 'x' ? 'h-8 w-1' : 'h-1 w-8',
          !disabled && 'group-hover/resize:bg-foreground/30 pointer-coarse:bg-foreground/20'
        )}
      />
    </div>
  );
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
 * inside it. Registers itself as a drop target with the enclosing
 * `DragAndDropProvider` (matched by its `data-dnd-drop-target-id` while a
 * drag hit-tests the pointer's position) so the floating ghost can morph to
 * match its shape once hovered — the dragged item itself never references
 * this component. While empty, its bottom edge is also a
 * resize handle: dragging it persists a freely chosen height for that
 * state via the enclosing `DragAndDropProvider`'s height map, keyed by this
 * area's own `id` — no per-area wiring is needed from the caller. A
 * manually set height carries over once an item is dropped in, so the area
 * doesn't collapse back to its content size the moment it becomes `filled`.
 * The handle's hit target grows under `pointer-coarse` (touch) input, since
 * the thin line that's precise enough for a mouse is too small to grab
 * reliably with a finger, and a small grip pill fades in to mark its
 * position for touch users, who never see the hover state a mouse would.
 * That grip pill (and the handle's interactivity) fades out along with the
 * rest of the empty-state affordances while the enclosing
 * `DragAndDropProvider` is `disabled`, since resizing isn't possible either.
 * An optional `resizeEdge` adds a matching side handle that persists a
 * freely chosen width the same way, keyed by this area's own `id` in the
 * enclosing `DragAndDropProvider`'s width map. Unlike the bottom-edge height
 * handle, it stays visible and usable even once `filled`, since it resizes
 * the area's own grid column rather than the area's own box — dropped
 * content shouldn't take away the ability to resize the layout column it
 * lives in.
 */
export function DragAndDropArea({ id, children, onDrop, className, filled, minHeight = 80, resizeEdge, minWidth = 160 }: DragAndDropAreaProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { disabled, hoveredAreaId, registerDropTarget, heights, setAreaHeight, setAreaWidth } = useDragAndDrop();
  const isHovered = hoveredAreaId === id;
  const height = heights[id];

  React.useEffect(() => registerDropTarget(id, onDrop), [id, onDrop, registerDropTarget]);

  return (
    <div
      ref={ref}
      data-slot="drag-and-drop-area"
      data-dnd-drop-target-id={id}
      data-hovered={isHovered ? '' : undefined}
      style={height !== undefined ? { height, alignSelf: 'start' } : undefined}
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
      {!filled && (
        <ResizeHandle
          axis="y"
          sign={1}
          min={minHeight}
          disabled={disabled}
          getSize={() => ref.current?.getBoundingClientRect().height ?? minHeight}
          onResize={(size) => setAreaHeight(id, size)}
          className="bottom-0"
        />
      )}
      {resizeEdge && (
        <ResizeHandle
          axis="x"
          sign={resizeEdge === 'right' ? 1 : -1}
          min={minWidth}
          disabled={disabled}
          getSize={() => ref.current?.getBoundingClientRect().width ?? minWidth}
          onResize={(size) => setAreaWidth(id, size)}
          className={resizeEdge === 'right' ? 'right-0' : 'left-0'}
        />
      )}
    </div>
  );
}
