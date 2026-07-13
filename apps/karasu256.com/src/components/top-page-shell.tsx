'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DragAndDropArea, DragAndDropProvider, LockIcon, SettingsSidebarLayout, useSessionUser } from '@Hashibutogarasu/ui';
import { useDragAndDropPlacement } from '@/hooks/use-drag-and-drop-placement';
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
  const t = useTranslations();
  const sessionUser = useSessionUser();
  const { placements, setPlacement, heights, setHeights } = useDragAndDropPlacement();
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
        <div className="flex flex-1 flex-col items-stretch gap-6 md:flex-row md:items-start">
          <DragAndDropArea
            id="left-pane"
            className="md:flex-1"
            filled={profileArea === 'left-pane'}
            onDrop={(payload) => setPlacement(payload.id, 'left-pane')}
          >
            {profileArea === 'left-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.left')}</span>}
          </DragAndDropArea>
          <DragAndDropArea
            id="center-pane"
            className="md:flex-1"
            filled={profileArea === 'center-pane'}
            onDrop={(payload) => setPlacement(payload.id, 'center-pane')}
          >
            {profileArea === 'center-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.center')}</span>}
          </DragAndDropArea>
          <DragAndDropArea
            id="right-pane"
            className="md:flex-1"
            filled={profileArea === 'right-pane'}
            onDrop={(payload) => setPlacement(payload.id, 'right-pane')}
          >
            {profileArea === 'right-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.right')}</span>}
          </DragAndDropArea>
        </div>
      </SettingsSidebarLayout>
    </DragAndDropProvider>
  );
}
