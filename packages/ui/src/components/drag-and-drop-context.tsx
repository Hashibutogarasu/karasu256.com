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
  activePayload: DragPayload | null;
  hoveredAreaId: string | null;
  beginDrag: (payload: DragPayload, event: React.PointerEvent) => void;
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

/**
 * Owns all drag-and-drop state for its subtree and renders the single
 * floating "ghost" that visually represents whatever is currently being
 * dragged. The ghost follows the pointer 1:1 over empty space, and morphs
 * (position/size/border-radius) to match whichever `DragAndDropArea` is
 * currently hovered, via a CSS transition gated by the `data-morphed`
 * attribute — see `drag-and-drop-context.css`.
 */
export function DragAndDropProvider({ children }: { children: React.ReactNode }) {
  const [activePayload, setActivePayload] = React.useState<DragPayload | null>(null);
  const [pointer, setPointer] = React.useState<PointerPosition | null>(null);
  const [hoveredShape, setHoveredShape] = React.useState<DragAndDropShape | null>(null);

  const activePayloadRef = React.useRef(activePayload);
  activePayloadRef.current = activePayload;
  const hoveredShapeRef = React.useRef(hoveredShape);
  hoveredShapeRef.current = hoveredShape;

  const isDragging = activePayload !== null;

  const beginDrag = React.useCallback((payload: DragPayload, event: React.PointerEvent) => {
    setActivePayload(payload);
    setPointer({ x: event.clientX, y: event.clientY });
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
      hoveredShapeRef.current?.onDrop?.(activePayloadRef.current!);
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
      activePayload,
      hoveredAreaId: hoveredShape?.id ?? null,
      beginDrag,
      registerHover,
      clearHover,
    }),
    [isDragging, activePayload, hoveredShape, beginDrag, registerHover, clearHover]
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

function DragGhost({ payload, pointer, shape }: DragGhostProps) {
  const style: React.CSSProperties = shape
    ? {
        left: shape.rect.left,
        top: shape.rect.top,
        width: shape.rect.width,
        height: shape.rect.height,
        borderRadius: shape.borderRadius,
      }
    : {
        left: pointer.x - payload.pointerOffsetX,
        top: pointer.y - payload.pointerOffsetY,
        width: payload.originRect.width,
        height: payload.originRect.height,
        borderRadius: payload.originBorderRadius,
      };

  return (
    <div className="dnd-ghost" data-morphed={shape ? '' : undefined} style={style}>
      {payload.content}
    </div>
  );
}
