'use client';

import { useRef } from 'react';
import { updateProfile } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, UserAvatar, toast } from '@Hashibutogarasu/ui';
import { useImageUpload } from '@Hashibutogarasu/utils/client';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { useSettingsUser } from '@/components/settings/user-context';
import { updateUserIcon } from '@/lib/api/update-user-icon';

/**
 * Avatar that opens the file picker on a plain click, and additionally
 * exposes a right-click / long-press context menu for uploading a new icon
 * or removing the current one. Falls back to an identicon when the user has
 * no icon set.
 */
export function ProfileIcon() {
  const t = useTranslations();
  const { user, updateUser } = useSettingsUser();
  const { upload } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function persistIcon(iconUrl: string | null) {
    try {
      await updateUserIcon(iconUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return;
    }

    const currentUser = getFirebaseAuth().currentUser;
    if (currentUser) {
      await updateProfile(currentUser, { photoURL: iconUrl });
    }
    updateUser({ photoURL: iconUrl });
    toast.success(t('profile.iconChanged'), { autoClose: true });
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const url = await upload(file, `users/${user.uid}/avatar.png`);
    if (!url) {
      toast.error(t('profile.uploadFailed'));
      return;
    }
    await persistIcon(url);
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger onClick={() => fileInputRef.current?.click()} aria-label={t('profile.changeIcon')}>
          <UserAvatar uid={user.uid} iconUrl={user.photoURL} size={48} className="border border-border" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>{t('profile.uploadIcon')}</ContextMenuItem>
          <ContextMenuItem variant="destructive" disabled={!user.photoURL} onClick={() => persistIcon(null)}>
            {t('profile.deleteIcon')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelected} />
    </>
  );
}
