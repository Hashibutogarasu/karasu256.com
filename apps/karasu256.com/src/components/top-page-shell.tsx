'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DragAndDropArea,
  DragAndDropProvider,
  LockIcon,
  SettingsSidebarLayout,
  useDragAndDrop,
  useSessionUser,
  type DragAndDropAreaProps,
} from '@Hashibutogarasu/ui';
import { useDragAndDropPlacement, type DragAndDropAreaId } from '@/hooks/use-drag-and-drop-placement';
import { TopPageSidebar } from './top-page-sidebar';
import { DraggableUserProfileItem } from './draggable-user-profile-item';

/**
 * Top-page playground: a home-page sidebar holding a draggable user-profile
 * item, plus three `DragAndDropArea` panes it can be dropped into. Placement
 * is persisted via `useDragAndDropPlacement` so it survives a reload. A
 * `LockIcon` in the sidebar title toggles `locked`, which disables dragging
 * across the whole `DragAndDropProvider` subtree so items become plain,
 * touchable content instead.
 *
 * Reads the signed-in user via `useSessionUser` (the same live,
 * cross-origin session as the header's account menu) rather than a
 * server-rendered prop, so the profile item's visibility can't disagree with
 * the header — a server-only session lookup can fail to see a cookie the
 * header's client-side check still finds (e.g. cross-subdomain cookie
 * quirks on some mobile browsers), which previously left the item
 * permanently absent for signed-in mobile users while the header correctly
 * showed them as signed in.
 */
export function TopPageShell() {
  const sessionUser = useSessionUser();
  const { placements, setPlacement, heights, setHeights, widths, setWidths } = useDragAndDropPlacement();
  const [locked, setLocked] = useState(false);
  const profileArea = placements['user-profile'] ?? 'sidebar';
  const profileItem = sessionUser ? (
    <DraggableUserProfileItem user={{ uid: sessionUser.uid, displayName: sessionUser.displayName ?? null, photoURL: sessionUser.iconUrl ?? null }} />
  ) : null;

  return (
    <DragAndDropProvider
      disabled={locked}
      onDropOutside={(payload) => setPlacement(payload.id, 'sidebar')}
      initialHeights={heights}
      onHeightsChange={setHeights}
      initialWidths={widths}
      onWidthsChange={setWidths}
    >
      <SettingsSidebarLayout
        sidebar={
          <TopPageSidebar
            onDrop={(payload) => setPlacement(payload.id, 'sidebar')}
            titleActions={[<LockIcon key="lock" locked={locked} onLockedChange={setLocked} />]}
          >
            {profileArea === 'sidebar' ? profileItem : null}
          </TopPageSidebar>
        }
      >
        <TopPagePanes profileArea={profileArea} profileItem={profileItem} setPlacement={setPlacement} />
      </SettingsSidebarLayout>
    </DragAndDropProvider>
  );
}

interface TopPagePanesProps {
  profileArea: DragAndDropAreaId;
  profileItem: ReactNode;
  setPlacement: ReturnType<typeof useDragAndDropPlacement>['setPlacement'];
}

interface PaneConfig {
  id: DragAndDropAreaId;
  resizeEdge?: 'left' | 'right';
  /** The pane on the other side of this one's resize handle, whose current width must be left room for. */
  otherPaneId?: DragAndDropAreaId;
  labelKey: 'home.panes.left' | 'home.panes.center' | 'home.panes.right';
}

/**
 * Renders the three-pane grid inside the `DragAndDropProvider`, reading the
 * live `widths` map straight from context so the left/right pane's manually
 * resized width is reflected in the grid's column tracks with no extra
 * render lag. Only `left-pane` and `right-pane` get a resize handle; the
 * center pane always fills whatever space they leave behind.
 */
function TopPagePanes({ profileArea, profileItem, setPlacement }: TopPagePanesProps) {
  const t = useTranslations();
  const { widths } = useDragAndDrop();
  const containerRef = useRef<HTMLDivElement>(null);
  /** Matches the `160px` floor baked into the grid's `minmax` column tracks below — keep both in sync. */
  const MIN_PANE_WIDTH = 160;
  const panes = useMemo<PaneConfig[]>(
    () => [
      { id: 'left-pane', resizeEdge: 'right', otherPaneId: 'right-pane', labelKey: 'home.panes.left' },
      { id: 'center-pane', labelKey: 'home.panes.center' },
      { id: 'right-pane', resizeEdge: 'left', otherPaneId: 'left-pane', labelKey: 'home.panes.right' },
    ],
    []
  );

  /**
   * Caps a side pane's width so growing it can never push the grid past its
   * own container — i.e. off the visible screen — by reserving room for the
   * gap on both sides, the center pane's minimum, and whatever the opposite
   * side pane currently measures (found via its `data-dnd-drop-target-id`,
   * the same attribute `DragAndDropArea` already exposes for drop-target hit
   * testing, so no extra ref plumbing is needed here).
   */
  function getMaxWidth(otherPaneId: DragAndDropAreaId) {
    const container = containerRef.current;
    if (!container) return Infinity;
    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const otherPane = container.querySelector<HTMLElement>(`[data-dnd-drop-target-id="${otherPaneId}"]`);
    const otherWidth = otherPane?.getBoundingClientRect().width ?? MIN_PANE_WIDTH;
    return Math.max(MIN_PANE_WIDTH, container.getBoundingClientRect().width - otherWidth - gap * 2 - MIN_PANE_WIDTH);
  }

  return (
    <div
      ref={containerRef}
      className="grid flex-1 grid-cols-1 items-stretch gap-6 md:items-start md:[grid-template-columns:var(--left-pane-width,minmax(0,1fr))_minmax(160px,1fr)_var(--right-pane-width,minmax(0,1fr))]"
      style={
        {
          '--left-pane-width': widths['left-pane'] !== undefined ? `${widths['left-pane']}px` : undefined,
          '--right-pane-width': widths['right-pane'] !== undefined ? `${widths['right-pane']}px` : undefined,
        } as CSSProperties
      }
    >
      {panes.map((pane) => (
        <PlaygroundPane
          key={pane.id}
          id={pane.id}
          resizeEdge={pane.resizeEdge}
          minWidth={MIN_PANE_WIDTH}
          getMaxWidth={pane.otherPaneId ? () => getMaxWidth(pane.otherPaneId!) : undefined}
          activeArea={profileArea}
          activeContent={profileItem}
          placeholder={t(pane.labelKey)}
          onDrop={(payload) => setPlacement(payload.id, pane.id)}
        />
      ))}
    </div>
  );
}

interface PlaygroundPaneProps {
  id: DragAndDropAreaId;
  resizeEdge?: DragAndDropAreaProps['resizeEdge'];
  minWidth?: DragAndDropAreaProps['minWidth'];
  getMaxWidth?: DragAndDropAreaProps['getMaxWidth'];
  /** The area id currently holding the draggable profile item — compared against `id` to decide whether this pane is the filled one, without this component ever hardcoding which pane it is. */
  activeArea: DragAndDropAreaId;
  activeContent: ReactNode;
  placeholder: string;
  onDrop: NonNullable<DragAndDropAreaProps['onDrop']>;
}

function PlaygroundPane({ id, resizeEdge, minWidth, getMaxWidth, activeArea, activeContent, placeholder, onDrop }: PlaygroundPaneProps) {
  const filled = activeArea === id;

  return (
    <DragAndDropArea
      id={id}
      className="min-w-0"
      filled={filled}
      resizeEdge={resizeEdge}
      minWidth={minWidth}
      getMaxWidth={getMaxWidth}
      onDrop={onDrop}
    >
      {filled ? activeContent : <span className="text-sm text-muted-foreground">{placeholder}</span>}
    </DragAndDropArea>
  );
}
