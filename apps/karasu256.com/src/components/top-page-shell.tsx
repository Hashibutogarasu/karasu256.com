'use client';

import { useTranslations } from 'next-intl';
import { DragAndDropArea, DragAndDropProvider, SettingsSidebarLayout } from '@Hashibutogarasu/ui';
import { useDragAndDropPlacement } from '@/hooks/use-drag-and-drop-placement';
import { TopPageSidebar } from './top-page-sidebar';
import { DraggableUserProfileItem, type DraggableUserProfileItemUser } from './draggable-user-profile-item';

export interface TopPageShellProps {
  user: DraggableUserProfileItemUser | null;
}

/**
 * Top-page playground: a home-page sidebar holding a draggable user-profile
 * item, plus three `DragAndDropArea` panes it can be dropped into. Placement
 * is persisted via `useDragAndDropPlacement` so it survives a reload.
 */
export function TopPageShell({ user }: TopPageShellProps) {
  const t = useTranslations();
  const { placements, setPlacement } = useDragAndDropPlacement();
  const profileArea = placements['user-profile'] ?? 'sidebar';
  const profileItem = user ? <DraggableUserProfileItem user={user} /> : null;

  return (
    <DragAndDropProvider>
      <SettingsSidebarLayout sidebar={<TopPageSidebar>{profileArea === 'sidebar' ? profileItem : null}</TopPageSidebar>}>
        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3">
          <DragAndDropArea id="left-pane" onDrop={(payload) => setPlacement(payload.id, 'left-pane')}>
            {profileArea === 'left-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.left')}</span>}
          </DragAndDropArea>
          <DragAndDropArea id="center-pane" onDrop={(payload) => setPlacement(payload.id, 'center-pane')}>
            {profileArea === 'center-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.center')}</span>}
          </DragAndDropArea>
          <DragAndDropArea id="right-pane" onDrop={(payload) => setPlacement(payload.id, 'right-pane')}>
            {profileArea === 'right-pane' ? profileItem : <span className="text-sm text-muted-foreground">{t('home.panes.right')}</span>}
          </DragAndDropArea>
        </div>
      </SettingsSidebarLayout>
    </DragAndDropProvider>
  );
}
