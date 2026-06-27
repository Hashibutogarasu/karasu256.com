"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { signInWithEmailPassword, registerWithEmailPassword } from "@/lib/api/auth-email-password";
import { Button } from "@Hashibutogarasu/ui";
import { Input } from "@Hashibutogarasu/ui";
import { Label } from "@Hashibutogarasu/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger, AnimatedHeight } from "@Hashibutogarasu/ui";
import { LocalizedPasswordStrengthIndicator } from "./localized-password-strength-indicator";

const SIGN_IN_ERROR_KEYS: Record<string, string> = {
  EMAIL_NOT_FOUND: "signIn.errorInvalidCredentials",
  INVALID_PASSWORD: "signIn.errorInvalidCredentials",
  INVALID_LOGIN_CREDENTIALS: "signIn.errorInvalidCredentials",
  TOO_MANY_ATTEMPTS_TRY_LATER: "signIn.errorTooManyAttempts",
  USER_DISABLED: "signIn.errorUserDisabled",
}

const REGISTER_ERROR_KEYS: Record<string, string> = {
  "auth/email-already-exists": "signIn.errorEmailAlreadyExists",
  "auth/invalid-password": "signIn.errorWeakPassword",
}

/**
 * Renders a tabbed email/password form that handles both sign-in and account
 * creation against Firebase Auth. Both tabs share the same email and password
 * state so the user can fill in credentials once and choose the action.
 */
export function EmailPasswordForm() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const activeIndex = tab === "signin" ? 0 : 1;

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const customToken = await signInWithEmailPassword(email, password);
      await signInWithCustomToken(getFirebaseAuth(), customToken);
    } catch (err) {
      const code = err instanceof Error ? err.message : String(err);
      toast.error(t(SIGN_IN_ERROR_KEYS[code] ?? code));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const customToken = await registerWithEmailPassword(email, password);
      await signInWithCustomToken(getFirebaseAuth(), customToken);
    } catch (err) {
      const code = err instanceof Error ? err.message : String(err);
      toast.error(t(REGISTER_ERROR_KEYS[code] ?? code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatedHeight>
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="relative w-full">
        <div
          aria-hidden="true"
          className="absolute top-[3px] bottom-[3px] left-[3px] rounded-md bg-background shadow-sm pointer-events-none"
          style={{
            width: "calc(50% - 3px)",
            transform: `translateX(calc(${activeIndex} * 100%))`,
            transition: "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        <TabsTrigger
          value="signin"
          className="relative z-10 data-active:bg-transparent data-active:shadow-none"
        >
          {t("signIn.tabs.signIn")}
        </TabsTrigger>
        <TabsTrigger
          value="register"
          className="relative z-10 data-active:bg-transparent data-active:shadow-none"
        >
          {t("signIn.tabs.createAccount")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <form onSubmit={handleSignIn} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">{t("signIn.email")}</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-password">{t("signIn.password")}</Label>
              <Link
                href="/reset-password"
                className="text-xs leading-none text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("signIn.forgotPassword")}
              </Link>
            </div>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <FontAwesomeIcon icon={faRightToBracket} />
            {loading ? t("signIn.signingIn") : t("signIn.submit")}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleRegister} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="register-email">{t("signIn.email")}</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">{t("signIn.password")}</Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <LocalizedPasswordStrengthIndicator password={password} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <FontAwesomeIcon icon={faUserPlus} />
            {loading ? t("signIn.creatingAccount") : t("signIn.createAccount")}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
    </AnimatedHeight>
  );
}
