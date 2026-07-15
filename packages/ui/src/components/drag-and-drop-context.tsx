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

/** A drop target's geometry, for {@link DragAndDropShape} — see {@link DragAndDropContextValue.registerDropTarget}'s `getShape`. */
export interface DropTargetShape {
  rect: DOMRect;
  borderRadius: string;
}

export interface DragAndDropContextValue {
  isDragging: boolean;
  /** When true, `Draggable` ignores pointer-down and never starts a drag — set via `DragAndDropProvider`'s `disabled` prop. */
  disabled: boolean;
  activePayload: DragPayload | null;
  hoveredAreaId: string | null;
  beginDrag: (payload: DragPayload, pointer: { clientX: number; clientY: number }) => void;
  /**
   * Registers a drop target's own DOM element (found via
   * `document.elementFromPoint` during a drag, matched by its
   * `data-dnd-drop-target-id` attribute — the caller must set that
   * attribute to `id` itself) so hovering it resolves `onDrop` and the
   * ghost's morph shape independent of `pointerenter`/`pointerleave`
   * ordering. `getShape` overrides the ghost's morph geometry (e.g. a small
   * slot inside a much larger drop target); omit it to use the matched
   * element's own rect. Returns an unregister function for effect cleanup.
   */
  registerDropTarget: (id: string, onDrop?: (payload: DragPayload) => void, getShape?: () => DropTargetShape) => () => void;
  /** Per-area manually resized heights (px), keyed by the area's own `id` — so a `DragAndDropArea` only needs its `id` to read/write its height. */
  heights: Record<string, number>;
  setAreaHeight: (id: string, height: number) => void;
  /** Per-area manually resized widths (px), keyed by the area's own `id` — so a `DragAndDropArea` only needs its `id` to read/write its width. */
  widths: Record<string, number>;
  setAreaWidth: (id: string, width: number) => void;
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
  /** Initial per-area heights (px), keyed by area id — e.g. hydrated from storage. */
  initialHeights?: Record<string, number>;
  /** Called with the full updated heights map whenever any area's height changes — e.g. to persist it. */
  onHeightsChange?: (heights: Record<string, number>) => void;
  /** Initial per-area widths (px), keyed by area id — e.g. hydrated from storage. */
  initialWidths?: Record<string, number>;
  /** Called with the full updated widths map whenever any area's width changes — e.g. to persist it. */
  onWidthsChange?: (widths: Record<string, number>) => void;
}

/**
 * Owns all drag-and-drop state for its subtree and renders the single
 * floating "ghost" that visually represents whatever is currently being
 * dragged. The ghost follows the pointer 1:1 over empty space, and morphs
 * (position/size/border-radius) to match whichever `DragAndDropArea` is
 * currently hovered, via a CSS transition gated by the `data-morphed`
 * attribute — see `drag-and-drop-context.css`.
 */
export function DragAndDropProvider({
  children,
  onDropOutside,
  disabled = false,
  initialHeights = {},
  onHeightsChange,
  initialWidths = {},
  onWidthsChange,
}: DragAndDropProviderProps) {
  const [activePayload, setActivePayload] = React.useState<DragPayload | null>(null);
  const [pointer, setPointer] = React.useState<PointerPosition | null>(null);
  const [hoveredShape, setHoveredShape] = React.useState<DragAndDropShape | null>(null);
  const [heights, setHeights] = React.useState<Record<string, number>>(initialHeights);
  const [widths, setWidths] = React.useState<Record<string, number>>(initialWidths);

  const activePayloadRef = React.useRef(activePayload);
  activePayloadRef.current = activePayload;
  const hoveredShapeRef = React.useRef(hoveredShape);
  hoveredShapeRef.current = hoveredShape;
  const onDropOutsideRef = React.useRef(onDropOutside);
  onDropOutsideRef.current = onDropOutside;
  const onHeightsChangeRef = React.useRef(onHeightsChange);
  onHeightsChangeRef.current = onHeightsChange;
  const onWidthsChangeRef = React.useRef(onWidthsChange);
  onWidthsChangeRef.current = onWidthsChange;
  const dropTargetsRef = React.useRef(new Map<string, { onDrop?: (payload: DragPayload) => void; getShape?: () => DropTargetShape }>());

  const isDragging = activePayload !== null;

  const beginDrag = React.useCallback((payload: DragPayload, pointer: { clientX: number; clientY: number }) => {
    setActivePayload(payload);
    setPointer({ x: pointer.clientX, y: pointer.clientY });
  }, []);

  const registerDropTarget = React.useCallback((id: string, onDrop?: (payload: DragPayload) => void, getShape?: () => DropTargetShape) => {
    dropTargetsRef.current.set(id, { onDrop, getShape });
    return () => {
      dropTargetsRef.current.delete(id);
    };
  }, []);

  const setAreaHeight = React.useCallback((id: string, height: number) => {
    setHeights((prev) => ({ ...prev, [id]: height }));
  }, []);

  const setAreaWidth = React.useCallback((id: string, width: number) => {
    setWidths((prev) => ({ ...prev, [id]: width }));
  }, []);

  const isFirstHeightsRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (isFirstHeightsRenderRef.current) {
      isFirstHeightsRenderRef.current = false;
      return;
    }
    onHeightsChangeRef.current?.(heights);
  }, [heights]);

  const isFirstWidthsRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (isFirstWidthsRenderRef.current) {
      isFirstWidthsRenderRef.current = false;
      return;
    }
    onWidthsChangeRef.current?.(widths);
  }, [widths]);

  /**
   * `initialHeights` is only used as `useState`'s initial value, so it's
   * lost if the caller only has it available asynchronously — e.g.
   * `useDragAndDropPlacement` starts with `{}` and hydrates from
   * `localStorage` inside its own effect, which resolves after this
   * component has already mounted. Adopt that first non-empty arrival once,
   * so a stored height still restores on reload; leave `heights` alone
   * afterward so it doesn't fight further resizes.
   */
  const didHydrateHeightsRef = React.useRef(false);
  React.useEffect(() => {
    if (didHydrateHeightsRef.current || Object.keys(initialHeights).length === 0) return;
    didHydrateHeightsRef.current = true;
    setHeights(initialHeights);
  }, [initialHeights]);

  /** Same async-hydration handling as {@link didHydrateHeightsRef}, for widths. */
  const didHydrateWidthsRef = React.useRef(false);
  React.useEffect(() => {
    if (didHydrateWidthsRef.current || Object.keys(initialWidths).length === 0) return;
    didHydrateWidthsRef.current = true;
    setWidths(initialWidths);
  }, [initialWidths]);

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

    /**
     * Hit-tests the element under the pointer directly, instead of relying
     * on each drop target's own `pointerenter`/`pointerleave` — those never
     * fire for a target the drag started inside (the pointer was already
     * there, so it never "entered"), which left a drag picked up from
     * inside one area unable to hover a different one.
     */
    function handlePointerMove(event: PointerEvent) {
      setPointer({ x: event.clientX, y: event.clientY });

      const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
      const targetEl = elementAtPoint?.closest<HTMLElement>('[data-dnd-drop-target-id]') ?? null;
      const targetId = targetEl?.dataset.dndDropTargetId ?? null;

      setHoveredShape((prev) => {
        if (targetId === (prev?.id ?? null)) return prev;
        if (!targetId || !targetEl) return null;
        const info = dropTargetsRef.current.get(targetId);
        const shape = info?.getShape
          ? info.getShape()
          : { rect: targetEl.getBoundingClientRect(), borderRadius: getComputedStyle(targetEl).borderRadius };
        return { id: targetId, rect: shape.rect, borderRadius: shape.borderRadius, onDrop: info?.onDrop };
      });
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
      registerDropTarget,
      heights,
      setAreaHeight,
      widths,
      setAreaWidth,
    }),
    [isDragging, disabled, activePayload, hoveredShape, beginDrag, registerDropTarget, heights, setAreaHeight, widths, setAreaWidth]
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
