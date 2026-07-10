'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DragAndDropArea, DragAndDropProvider, LockIcon, SettingsSidebarLayout } from '@Hashibutogarasu/ui';
import { useDragAndDropPlacement } from '@/hooks/use-drag-and-drop-placement';
import { TopPageSidebar } from './top-page-sidebar';
import { DraggableUserProfileItem, type DraggableUserProfileItemUser } from './draggable-user-profile-item';

export interface TopPageShellProps {
  user: DraggableUserProfileItemUser | null;
}

/**
 * Top-page playground: a home-page sidebar holding a draggable user-profile
 * item, plus three `DragAndDropArea` panes it can be dropped into. Placement
 * is persisted via `useDragAndDropPlacement` so it survives a reload. A
 * `LockIcon` in the sidebar title toggles `locked`, which disables dragging
 * across the whole `DragAndDropProvider` subtree so items become plain,
 * touchable content instead.
 */
export function TopPageShell({ user }: TopPageShellProps) {
  const t = useTranslations();
  const { placements, setPlacement } = useDragAndDropPlacement();
  const [locked, setLocked] = useState(false);
  const profileArea = placements['user-profile'] ?? 'sidebar';
  const profileItem = user ? <DraggableUserProfileItem user={user} /> : null;

  return (
    <DragAndDropProvider disabled={locked} onDropOutside={(payload) => setPlacement(payload.id, 'sidebar')}>
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
        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3">
          <DragAndDropArea id="left-pane" filled={profileArea === 'left-pane'} onDrop={(payload) => setPlacement(payload.id, 'left-pane')}>
            {profileArea === 'left-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.left')}</span>}
          </DragAndDropArea>
          <DragAndDropArea id="center-pane" filled={profileArea === 'center-pane'} onDrop={(payload) => setPlacement(payload.id, 'center-pane')}>
            {profileArea === 'center-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.center')}</span>}
          </DragAndDropArea>
          <DragAndDropArea id="right-pane" filled={profileArea === 'right-pane'} onDrop={(payload) => setPlacement(payload.id, 'right-pane')}>
            {profileArea === 'right-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.right')}</span>}
          </DragAndDropArea>
        </div>
      </SettingsSidebarLayout>
    </DragAndDropProvider>
  );
}
