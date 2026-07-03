"use client";

import { useState } from "react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { toast } from "@Hashibutogarasu/ui";
import { signInWithEmailPassword, registerWithEmailPassword } from "@/lib/api/auth-email-password";
import { Button, Input, Label, PasswordInput } from "@Hashibutogarasu/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger, AnimatedHeight } from "@Hashibutogarasu/ui";
import { LocalizedPasswordStrengthIndicator } from "./localized-password-strength-indicator";

/**
 * Renders a tabbed email/password form that handles both sign-in and account
 * creation against Firebase Auth. Both tabs share the same email and password
 * state so the user can fill in credentials once and choose the action.
 */
export function EmailPasswordForm() {
  const t = useTranslations();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const activeIndex = tab === "signin" ? 0 : 1;

  function showAuthError(err: unknown) {
    const code = err instanceof FirebaseError ? err.code.replace("auth/", "") : "unknown";
    const key = `signIn.error.${code}`;
    toast.error(t.has(key) ? t(key) : t("signIn.error.unknown"));
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailPassword(email, password);
    } catch (err) {
      showAuthError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await registerWithEmailPassword(email, password);
    } catch (err) {
      showAuthError(err);
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
              name="username"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
            <PasswordInput
              id="signin-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">{t("signIn.password")}</Label>
            <PasswordInput
              id="register-password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
