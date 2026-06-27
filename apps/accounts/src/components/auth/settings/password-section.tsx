"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { useSettingsUser } from "@/components/settings/user-context";
import { Button } from "@Hashibutogarasu/ui";
import { Input } from "@Hashibutogarasu/ui";
import { Label } from "@Hashibutogarasu/ui";
import { LocalizedPasswordStrengthIndicator } from "@/components/auth/localized-password-strength-indicator";

/**
 * Allows email/password users to change their password.
 * Hidden for users who have no password provider linked.
 * Re-authenticates with the current password before updating.
 */
export function PasswordSection() {
  const { t } = useTranslation();
  const { user } = useSettingsUser();
  const hasPasswordProvider = user.providerData.some((p) => p.providerId === "password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!hasPasswordProvider) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast.success(t("security.passwordChanged"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("security.title")}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="current-password">{t("security.currentPassword")}</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-password">{t("security.newPassword")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            disabled={saving}
          />
          <LocalizedPasswordStrengthIndicator password={newPassword} />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={saving}>
          {saving ? t("security.changing") : t("security.changePassword")}
        </Button>
      </form>
    </div>
  );
}
