'use client';

import * as React from 'react';
import './drag-and-drop-context.css';

/**
 * Snapshot of a {@link Draggable} captured at the moment a drag begins.
 * `content` is rendered verbatim inside the floating ghost while the drag
 * is active — it is the only place the dragged content is rendered mid-drag.
 */
export interface DragPayload {
  id: string;
  content: React.ReactNode;
  originRect: DOMRect;
  originBorderRadius: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
}

/**
 * Geometry a {@link DragAndDropArea} pushes into context while a drag is
 * hovering over it, so the floating ghost can morph to match its shape
 * without the dragged item ever knowing about the area.
 */
export interface DragAndDropShape {
  id: string;
  rect: DOMRect;
  borderRadius: string;
  onDrop?: (payload: DragPayload) => void;
}

export interface DragAndDropContextValue {
  isDragging: boolean;
  /** When true, `Draggable` ignores pointer-down and never starts a drag — set via `DragAndDropProvider`'s `disabled` prop. */
  disabled: boolean;
  activePayload: DragPayload | null;
  hoveredAreaId: string | null;
  beginDrag: (payload: DragPayload, pointer: { clientX: number; clientY: number }) => void;
  registerHover: (shape: DragAndDropShape) => void;
  clearHover: (id: string) => void;
}

const DragAndDropContext = React.createContext<DragAndDropContextValue | null>(null);

/**
 * Returns the enclosing {@link DragAndDropProvider}'s drag state and
 * controls. Throws if called outside a `DragAndDropProvider`.
 */
export function useDragAndDrop(): DragAndDropContextValue {
  const ctx = React.useContext(DragAndDropContext);
  if (!ctx) throw new Error('useDragAndDrop must be used within a DragAndDropProvider');
  return ctx;
}

interface PointerPosition {
  x: number;
  y: number;
}

export interface DragAndDropProviderProps {
  children: React.ReactNode;
  /** Called when a drag ends without landing on any registered `DragAndDropArea`/target — e.g. to send the item back to a default location. */
  onDropOutside?: (payload: DragPayload) => void;
  /** When true, every `Draggable` in this subtree ignores pointer-down and its content becomes plain, non-draggable content instead. */
  disabled?: boolean;
}

/**
 * Owns all drag-and-drop state for its subtree and renders the single
 * floating "ghost" that visually represents whatever is currently being
 * dragged. The ghost follows the pointer 1:1 over empty space, and morphs
 * (position/size/border-radius) to match whichever `DragAndDropArea` is
 * currently hovered, via a CSS transition gated by the `data-morphed`
 * attribute — see `drag-and-drop-context.css`.
 */
export function DragAndDropProvider({ children, onDropOutside, disabled = false }: DragAndDropProviderProps) {
  const [activePayload, setActivePayload] = React.useState<DragPayload | null>(null);
  const [pointer, setPointer] = React.useState<PointerPosition | null>(null);
  const [hoveredShape, setHoveredShape] = React.useState<DragAndDropShape | null>(null);

  const activePayloadRef = React.useRef(activePayload);
  activePayloadRef.current = activePayload;
  const hoveredShapeRef = React.useRef(hoveredShape);
  hoveredShapeRef.current = hoveredShape;
  const onDropOutsideRef = React.useRef(onDropOutside);
  onDropOutsideRef.current = onDropOutside;

  const isDragging = activePayload !== null;

  const beginDrag = React.useCallback((payload: DragPayload, pointer: { clientX: number; clientY: number }) => {
    setActivePayload(payload);
    setPointer({ x: pointer.clientX, y: pointer.clientY });
  }, []);

  const registerHover = React.useCallback((shape: DragAndDropShape) => {
    setHoveredShape(shape);
  }, []);

  const clearHover = React.useCallback((id: string) => {
    setHoveredShape((prev) => (prev?.id === id ? null : prev));
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    function endDrag() {
      const shape = hoveredShapeRef.current;
      const payload = activePayloadRef.current!;
      if (shape) {
        shape.onDrop?.(payload);
      } else {
        onDropOutsideRef.current?.(payload);
      }
      setActivePayload(null);
      setPointer(null);
      setHoveredShape(null);
    }

    function handlePointerMove(event: PointerEvent) {
      setPointer({ x: event.clientX, y: event.clientY });
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [isDragging]);

  const value = React.useMemo<DragAndDropContextValue>(
    () => ({
      isDragging,
      disabled,
      activePayload,
      hoveredAreaId: hoveredShape?.id ?? null,
      beginDrag,
      registerHover,
      clearHover,
    }),
    [isDragging, disabled, activePayload, hoveredShape, beginDrag, registerHover, clearHover]
  );

  return (
    <DragAndDropContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[70]">
        {isDragging && pointer && activePayload && <DragGhost payload={activePayload} pointer={pointer} shape={hoveredShape} />}
      </div>
    </DragAndDropContext.Provider>
  );
}

interface DragGhostProps {
  payload: DragPayload;
  pointer: PointerPosition;
  shape: DragAndDropShape | null;
}

interface RenderedSize {
  width: number;
  height: number;
  borderRadius: string;
}

/**
 * The ghost always stays centered under the pointer — it never relocates to
 * an area's absolute position, so it never appears to "jump away" from the
 * cursor. Only its size/border-radius morph to match the hovered area,
 * delayed by one animation frame so the CSS transition (armed by the
 * `data-morphed` attribute) is already active before the geometry changes;
 * otherwise the attribute and the geometry would change in the same commit
 * and the browser would snap to the new size instantly instead of animating.
 */
function DragGhost({ payload, pointer, shape }: DragGhostProps) {
  const [renderedSize, setRenderedSize] = React.useState<RenderedSize | null>(null);

  React.useEffect(() => {
    if (!shape) {
      setRenderedSize(null);
      return;
    }
    const raf = requestAnimationFrame(() =>
      setRenderedSize({ width: shape.rect.width, height: shape.rect.height, borderRadius: shape.borderRadius })
    );
    return () => cancelAnimationFrame(raf);
  }, [shape]);

  const width = renderedSize?.width ?? payload.originRect.width;
  const height = renderedSize?.height ?? payload.originRect.height;
  const borderRadius = renderedSize?.borderRadius ?? payload.originBorderRadius;

  const style: React.CSSProperties = renderedSize
    ? { left: pointer.x - width / 2, top: pointer.y - height / 2, width, height, borderRadius }
    : { left: pointer.x - payload.pointerOffsetX, top: pointer.y - payload.pointerOffsetY, width, height, borderRadius };

  return (
    <div className="dnd-ghost" data-morphed={shape ? '' : undefined} style={style}>
      {payload.content}
    </div>
  );
}
