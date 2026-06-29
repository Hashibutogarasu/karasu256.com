"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { useSettingsUser } from "@/components/settings/user-context";
import { Button } from "@Hashibutogarasu/ui";
import { Input } from "@Hashibutogarasu/ui";
import { Label } from "@Hashibutogarasu/ui";
import { LocalizedPasswordStrengthIndicator } from "@/components/auth/localized-password-strength-indicator";

/**
 * Allows email users to set or change their password.
 *
 * - No password provider: links email/password via {@link linkWithCredential}.
 * - Has password provider: re-authenticates then calls {@link updatePassword}.
 *
 * Hidden for users with no email address.
 */
export function PasswordSection() {
  const { t } = useTranslation();
  const { user, updateUser } = useSettingsUser();
  const hasPasswordProvider = user.providerData.some((p) => p.providerId === "password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user.email) return null;

  function showError(err: unknown) {
    const code = err instanceof FirebaseError ? err.code.replace("auth/", "") : "unknown";
    toast.error(t(`security.error.${code}`, { defaultValue: t("security.error.unknown") }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast.success(t("security.passwordChanged"));
      } else {
        const credential = EmailAuthProvider.credential(user.email!, newPassword);
        await linkWithCredential(user, credential);
        await user.reload();
        const fresh = getFirebaseAuth().currentUser;
        if (fresh) updateUser({ providerData: fresh.providerData });
        toast.success(t("security.passwordSet"));
      }
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      showError(err);
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
        {hasPasswordProvider && (
          <div className="space-y-1">
            <Label htmlFor="current-password">{t("security.currentPassword")}</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              required
              disabled={saving}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="new-password">{t("security.newPassword")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            required
            minLength={6}
            disabled={saving}
          />
          <LocalizedPasswordStrengthIndicator password={newPassword} />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={saving}>
          {hasPasswordProvider
            ? saving ? t("security.changing") : t("security.changePassword")
            : saving ? t("security.setting") : t("security.setPassword")}
        </Button>
      </form>
    </div>
  );
}
