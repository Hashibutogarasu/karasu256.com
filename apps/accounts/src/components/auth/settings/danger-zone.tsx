"use client";

import { useState } from "react";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { useSettingsUser } from "@/components/settings/user-context";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { clearSession } from "@/lib/api/auth-session";
import { Button } from "@Hashibutogarasu/ui";
import { Input } from "@Hashibutogarasu/ui";
import { Label } from "@Hashibutogarasu/ui";

/**
 * Account deletion UI.
 * Email/password users confirm with their current password.
 * OAuth-only users re-authenticate via popup before deletion.
 * After deletion, clears the session cookie and signs out — `onAuthStateChanged`
 * in the parent then redirects to `/`.
 */
export function DangerZone() {
  const { t } = useTranslation();
  const { user } = useSettingsUser();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const hasPasswordProvider = user.providerData.some((p) => p.providerId === "password");

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    try {
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }
      await deleteUser(user);
      await clearSession();
      await signOut(getFirebaseAuth());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-destructive uppercase tracking-wide">
        {t("dangerZone.title")}
      </p>
      {!confirming ? (
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive hover:bg-destructive/5"
          onClick={() => setConfirming(true)}
        >
          {t("dangerZone.deleteAccount")}
        </Button>
      ) : (
        <form onSubmit={handleDelete} className="space-y-3">
          {hasPasswordProvider ? (
            <div className="space-y-1">
              <Label htmlFor="confirm-password">{t("dangerZone.confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={deleting}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dangerZone.reauthRequired")}</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              {t("dangerZone.cancel")}
            </Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={deleting}>
              {deleting ? t("dangerZone.deleting") : t("dangerZone.delete")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
