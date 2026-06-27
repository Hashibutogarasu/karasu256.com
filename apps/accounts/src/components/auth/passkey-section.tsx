"use client";

import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFingerprint } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { authenticateWithPasskey } from "@/lib/api/passkey-authenticate";
import { Button } from "@Hashibutogarasu/ui";

/**
 * Renders the passkey sign-in button for unauthenticated users.
 *
 * Uses a discoverable credential lookup so no email is required.
 * Delegates the WebAuthn + server round-trips to {@link authenticateWithPasskey}.
 */
export function PasskeySection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      const customToken = await authenticateWithPasskey();
      await signInWithCustomToken(getFirebaseAuth(), customToken);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleSignIn}
      disabled={loading}
    >
      <FontAwesomeIcon icon={faFingerprint} />
      {loading ? t("passkey.waiting") : t("passkey.signIn")}
    </Button>
  );
}
