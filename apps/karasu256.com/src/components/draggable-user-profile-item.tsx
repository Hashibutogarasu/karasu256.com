'use client';

import { Draggable, UserAvatar } from '@Hashibutogarasu/ui';

export interface DraggableUserProfileItemUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface DraggableUserProfileItemProps {
  user: DraggableUserProfileItemUser;
}

/**
 * Example draggable component: a user-profile card. Fills whatever space
 * its container gives it (a compact row in the sidebar, or the full size of
 * a `DragAndDropArea` once dropped there) — never imports `DragAndDropArea`
 * itself, so it has no knowledge of any specific drop target.
 */
export function DraggableUserProfileItem({ user }: DraggableUserProfileItemProps) {
  return (
    <Draggable id="user-profile" className="h-full w-full">
      <div className="flex h-full min-h-10 w-full items-center gap-2 rounded-md px-2 hover:bg-sidebar-accent">
        <UserAvatar uid={user.uid} iconUrl={user.photoURL} size={32} />
        <span className="min-w-0 truncate text-sm font-medium group-data-[collapsible=icon]:hidden">{user.displayName ?? user.uid}</span>
      </div>
    </Draggable>
  );
}
