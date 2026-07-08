'use client';

import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { useSettingsUser } from '@/components/settings/user-context';
import { Button } from '@Hashibutogarasu/ui';
import { Input } from '@Hashibutogarasu/ui';
import { Label } from '@Hashibutogarasu/ui';
import { Skeleton } from '@Hashibutogarasu/ui';
import { ProfileIcon } from './profile-icon';

/** Displays the user's avatar (uploadable) and allows editing their display name. */
export function ProfileSection() {
  const t = useTranslations();
  const { user, updateUser } = useSettingsUser();
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName });
      updateUser({ displayName });
      toast.success(t('profile.saved'), { autoClose: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('profile.title')}</p>
      <div className="flex items-center gap-3">
        <ProfileIcon />
        <p className="text-sm text-muted-foreground break-all">{user.displayName ?? user.email ?? user.uid}</p>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="display-name">{t('profile.displayName')}</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            disabled={saving}
            autoComplete="name"
          />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={saving}>
          {saving ? t('profile.saving') : t('profile.save')}
        </Button>
      </form>
    </div>
  );
}

/**
 * Placeholder for {@link ProfileSection} shown while the authenticated user
 * is still resolving. Mirrors the real layout so only the identicon and the
 * display name next to it appear as skeletons; the form itself renders with
 * its final structure and stays disabled until the user is ready.
 */
export function ProfileSectionSkeleton() {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('profile.title')}</p>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="display-name">{t('profile.displayName')}</Label>
          <Input id="display-name" value="" disabled autoComplete="name" />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled>
          {t('profile.save')}
        </Button>
      </div>
    </div>
  );
}
