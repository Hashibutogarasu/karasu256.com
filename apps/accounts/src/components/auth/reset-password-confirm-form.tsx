"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faKey } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { verifyPasswordResetToken, setNewPassword } from "@Hashibutogarasu/utils/client";
import { Button } from "@Hashibutogarasu/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@Hashibutogarasu/ui";
import { Input } from "@Hashibutogarasu/ui";
import { Label } from "@Hashibutogarasu/ui";

type Stage = "verifying" | "invalid" | "form" | "done";

interface Props {
  uid: string;
  token: string;
}

/**
 * Verifies the one-time reset token on mount, then lets the user set a
 * new password. Renders inline error states for expired or invalid links.
 */
export function ResetPasswordConfirmForm({ uid, token }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("verifying");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setStage("invalid");
      return;
    }
    verifyPasswordResetToken(uid, token)
      .then(() => setStage("form"))
      .catch(() => setStage("invalid"));
  }, [uid, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await setNewPassword(password);
      setStage("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("resetPassword.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage === "verifying" && (
          <p className="text-sm text-muted-foreground">{t("resetPassword.verifying")}</p>
        )}

        {stage === "invalid" && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{t("resetPassword.invalidToken")}</p>
            <Link
              href="/reset-password"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              {t("resetPassword.requestAgain")}
            </Link>
          </div>
        )}

        {stage === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("resetPassword.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <FontAwesomeIcon icon={faKey} />
              {loading ? t("resetPassword.setting") : t("resetPassword.setPassword")}
            </Button>
          </form>
        )}

        {stage === "done" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("resetPassword.setDone")}</p>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              {t("resetPassword.backToSignIn")}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
