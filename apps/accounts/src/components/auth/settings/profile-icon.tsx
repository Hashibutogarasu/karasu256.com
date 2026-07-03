'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Spinner,
  UserAvatar,
  toast,
} from '@Hashibutogarasu/ui';
import { uploadUserIcon, deleteUserIcon, setUserIconFromProvider, listLinkedProviders, type ProviderProfile } from '@Hashibutogarasu/utils/client';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { useSettingsUser } from '@/components/settings/user-context';
import { cn } from '@/lib/utils';

/** Formats a submenu entry as "user name (Provider)", falling back to just the provider name. */
function providerLabel(providerId: string, profile: ProviderProfile): string {
  const displayName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
  return profile.name ? `${profile.name} (${displayName})` : displayName;
}

/**
 * Avatar that opens the file picker on a plain click, and additionally
 * exposes a right-click / long-press context menu for uploading a new icon,
 * reusing a linked provider's avatar, or removing the current one. Falls
 * back to an identicon when the user has no icon set.
 */
export function ProfileIcon() {
  const t = useTranslations();
  const { user, updateUser } = useSettingsUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [providers, setProviders] = useState<Record<string, ProviderProfile>>({});
  const providerEntries = useMemo(() => Object.entries(providers), [providers]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listLinkedProviders()
      .then(setProviders)
      .catch(() => {});
  }, []);

  /**
   * Reloads the client Firebase user so its cached `photoURL` reflects the
   * value the server just wrote via the Admin SDK, then pushes it into
   * {@link useSettingsUser}'s context so {@link UserAvatar} re-renders.
   */
  async function syncPhotoURL(): Promise<void> {
    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser) return;
    await currentUser.reload();
    updateUser({ photoURL: getFirebaseAuth().currentUser?.photoURL ?? null });
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setSaving(true);
    try {
      await uploadUserIcon(file);
      await syncPhotoURL();
      toast.success(t('profile.iconChanged'), { autoClose: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectProvider(providerId: string) {
    setSaving(true);
    try {
      await setUserIconFromProvider(providerId);
      await syncPhotoURL();
      toast.success(t('profile.iconChanged'), { autoClose: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteIcon() {
    setSaving(true);
    try {
      await deleteUserIcon();
      await syncPhotoURL();
      toast.success(t('profile.iconChanged'), { autoClose: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger onClick={() => !saving && fileInputRef.current?.click()} aria-label={t('profile.changeIcon')}>
          <div className="relative size-12">
            <UserAvatar uid={user.uid} iconUrl={user.photoURL} size={48} className={cn('border border-border', saving && 'opacity-40')} />
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <Spinner className="size-5" />
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>{t('profile.uploadIcon')}</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={providerEntries.length === 0}>{t('profile.useProviderIcon')}</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {providerEntries.map(([providerId, profile]) => (
                <ContextMenuItem key={providerId} disabled={!profile.avatarUrl} onClick={() => handleSelectProvider(providerId)}>
                  {providerLabel(providerId, profile)}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem variant="destructive" disabled={!user.photoURL} onClick={handleDeleteIcon}>
            {t('profile.deleteIcon')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelected} />
    </>
  );
}
