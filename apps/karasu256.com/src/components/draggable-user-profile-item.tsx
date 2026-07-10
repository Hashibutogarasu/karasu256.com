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
 * Example draggable component: a small user-profile card. Never imports
 * `DragAndDropArea` — it has no knowledge of any specific drop target.
 */
export function DraggableUserProfileItem({ user }: DraggableUserProfileItemProps) {
  return (
    <Draggable id="user-profile">
      <div className="flex h-10 items-center gap-2 rounded-md px-2 hover:bg-sidebar-accent">
        <UserAvatar uid={user.uid} iconUrl={user.photoURL} size={32} />
        <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">{user.displayName ?? user.uid}</span>
      </div>
    </Draggable>
  );
}
