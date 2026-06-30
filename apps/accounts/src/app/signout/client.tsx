"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { SigningOutView } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { clearSession } from "@/lib/api/auth-session";

/**
 * Clears the Firebase Auth state and the server-side session cookie,
 * then navigates to the `next` search param URL.
 */
export function SignOutClient() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    async function performSignOut() {
      try {
        await clearSession();
        await signOut(getFirebaseAuth());
      } finally {
        window.location.replace(searchParams.get("next") ?? "/");
      }
    }
    performSignOut();
  }, [searchParams]);

  return <SigningOutView message={t("settings.signingOut")} />;
}
