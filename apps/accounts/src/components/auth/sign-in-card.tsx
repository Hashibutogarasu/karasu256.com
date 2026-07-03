"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { createSession } from "@/lib/api/auth-session";
import { Container, CardContent, CardHeader } from "@Hashibutogarasu/ui";
import { Separator } from "@Hashibutogarasu/ui";
import { Skeleton } from "@Hashibutogarasu/ui";
import { EmailPasswordForm } from "./email-password-form";
import { PasskeySection } from "./passkey-section";
import { SocialButtons } from "./social-buttons";

/**
 * Sign-in card for unauthenticated users.
 *
 * On Firebase auth state change to a signed-in user:
 * 1. Creates a Firebase session cookie via {@link createSession}.
 * 2. Creates a NextAuth JWT (cross-domain) via credentials sign-in.
 * 3. Redirects to `/settings`.
 */
export function SignInCard() {
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let redirecting = false;
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      if (redirecting) return;
      redirecting = true;
      try {
        const idToken = await user.getIdToken();
        await createSession(idToken);
        nextAuthSignIn("credentials", { idToken, redirect: false }).catch(() => {});
        router.replace("/settings");
      } catch {
        redirecting = false;
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <Container className="max-w-sm">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Container>
    );
  }

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">
        {t("signIn.title")}
      </CardHeader>
      <CardContent className="space-y-6">
        <EmailPasswordForm />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t("signIn.or")}</span>
          <Separator className="flex-1" />
        </div>
        <SocialButtons />
        <PasskeySection />
      </CardContent>
    </Container>
  );
}
