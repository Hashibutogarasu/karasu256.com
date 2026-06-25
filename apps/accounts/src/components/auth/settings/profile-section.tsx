"use client";

import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { useSettingsUser } from "@/components/settings/user-context";
import { Button } from "@Hashibutogarasu/ui";
import { Input } from "@Hashibutogarasu/ui";
import { Label } from "@Hashibutogarasu/ui";
import { Identicon } from "@Hashibutogarasu/ui";

/** Displays the user's identicon avatar and allows editing their display name. */
export function ProfileSection() {
  const { t } = useTranslation();
  const { user, updateUser } = useSettingsUser();
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName });
      updateUser({ displayName });
      toast.success(t("profile.saved"), { duration: 1000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("profile.title")}
      </p>
      <div className="flex items-center gap-3">
        <Identicon value={user.uid} size={48} className="border border-border" />
        <p className="text-sm text-muted-foreground break-all">{user.email ?? user.uid}</p>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="display-name">{t("profile.displayName")}</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={saving}
            autoComplete="name"
          />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={saving}>
          {saving ? t("profile.saving") : t("profile.save")}
        </Button>
      </form>
    </div>
  );
}
