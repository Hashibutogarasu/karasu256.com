'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';
import { useSettingsUser } from '@/components/settings/user-context';
import { Button } from '@Hashibutogarasu/ui';
import { Input } from '@Hashibutogarasu/ui';
import { Label } from '@Hashibutogarasu/ui';
import { ProfileIcon } from './profile-icon';

/**
 * Displays the user's avatar (uploadable) and allows editing their display
 * name. Renders immediately (no loading skeleton) so the page is
 * recognizable as soon as it mounts; the text input, save button, and avatar
 * stay disabled until {@link useSettingsUser}'s `ready` flag flips true,
 * which happens once the better-auth session resolves.
 */
export function ProfileSection() {
  const t = useTranslations();
  const { user, ready, updateUser } = useSettingsUser();
  const [displayName, setDisplayName] = useState(user.name ?? '');
  const [saving, setSaving] = useState(false);
  const disabled = !ready || saving;

  /**
   * better-auth's `user` row is the source of truth; the server-side
   * `syncProfileToFirebase` hook mirrors it onto Firebase.
   */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await authClient.updateUser({ name: displayName });
      updateUser({ name: displayName });
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
        <p className="text-sm text-muted-foreground break-all">{user.name ?? user.email ?? user.id}</p>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="display-name">{t('profile.displayName')}</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            disabled={disabled}
            autoComplete="name"
          />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={disabled}>
          {saving ? t('profile.saving') : t('profile.save')}
        </Button>
      </form>
    </div>
  );
}
