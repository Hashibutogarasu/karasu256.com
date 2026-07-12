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
  UserAvatar,
  toast,
} from '@Hashibutogarasu/ui';
import { uploadUserIcon, deleteUserIcon, setUserIconFromProvider, listLinkedProviders, type ProviderProfile } from '@Hashibutogarasu/utils/client';
import { useSettingsUser } from '@/components/settings/user-context';

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
 *
 * The icon itself is still stored on the Firebase user record (`api/user/icon`),
 * not in better-auth's own `image` column, so each handler below applies the
 * URL the server returns to {@link useSettingsUser}'s context directly
 * instead of waiting on a better-auth session refetch to pick it up.
 */
export function ProfileIcon() {
  const t = useTranslations();
  const { user, updateUser } = useSettingsUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [providers, setProviders] = useState<Record<string, ProviderProfile>>({});
  const providerEntries = useMemo(() => Object.entries(providers), [providers]);

  useEffect(() => {
    listLinkedProviders()
      .then(setProviders)
      .catch(() => {});
  }, []);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    let photoURL: string;
    try {
      photoURL = await uploadUserIcon(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return;
    }
    updateUser({ image: photoURL });
    toast.success(t('profile.iconChanged'), { autoClose: true });
  }

  async function handleSelectProvider(providerId: string) {
    let photoURL: string;
    try {
      photoURL = await setUserIconFromProvider(providerId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return;
    }
    updateUser({ image: photoURL });
    toast.success(t('profile.iconChanged'), { autoClose: true });
  }

  async function handleDeleteIcon() {
    try {
      await deleteUserIcon();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return;
    }
    updateUser({ image: null });
    toast.success(t('profile.iconChanged'), { autoClose: true });
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger onClick={() => fileInputRef.current?.click()} aria-label={t('profile.changeIcon')}>
          <UserAvatar uid={user.id} iconUrl={user.image ?? null} size={48} className="border border-border" />
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
          <ContextMenuItem variant="destructive" disabled={!user.image} onClick={handleDeleteIcon}>
            {t('profile.deleteIcon')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelected} />
    </>
  );
}
