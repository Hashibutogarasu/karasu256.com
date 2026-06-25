"use client";

import { useEffect, useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  getIdToken,
  linkWithPopup,
  unlink,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { toast } from "@Hashibutogarasu/ui";
import { useSettingsUser } from "@/components/settings/user-context";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { listPasskeyCredentials } from "@/lib/api/passkey-credentials";
import { Button } from "@Hashibutogarasu/ui";

const PROVIDERS = [
  { id: "google.com", label: "Google", icon: faGoogle, getInstance: () => new GoogleAuthProvider() },
  { id: "github.com", label: "GitHub", icon: faGithub, getInstance: () => new GithubAuthProvider() },
] as const;

/**
 * Displays linked OAuth providers (Google, GitHub) with link/unlink controls.
 * Unlinking the last provider is permitted when the user has registered passkeys,
 * since passkeys remain a valid sign-in method.
 */
export function ProviderSection() {
  const { t } = useTranslation();
  const { user, updateUser } = useSettingsUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [hasPasskeys, setHasPasskeys] = useState(false);

  useEffect(() => {
    const current = getFirebaseAuth().currentUser;
    if (!current) return;
    getIdToken(current)
      .then((idToken) => listPasskeyCredentials(idToken))
      .then((creds) => setHasPasskeys(creds.length > 0))
      .catch(() => {});
  }, []);

  const linkedIds = new Set(user.providerData.map((p) => p.providerId));
  const canUnlink = user.providerData.length > 1 || hasPasskeys;

  async function handleLink(providerId: string, getInstance: () => GoogleAuthProvider | GithubAuthProvider) {
    setLoading(providerId);
    try {
      const result = await linkWithPopup(getFirebaseAuth().currentUser!, getInstance());
      updateUser({ providerData: result.user.providerData });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleUnlink(providerId: string) {
    setLoading(providerId);
    try {
      const updated = await unlink(getFirebaseAuth().currentUser!, providerId);
      updateUser({ providerData: updated.providerData });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("connections.title")}
      </p>
      {PROVIDERS.map(({ id, label, icon, getInstance }) => {
        const isLinked = linkedIds.has(id);
        const isLoading = loading === id;
        return (
          <div key={id} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={icon} />
              {label}
            </span>
            {isLinked ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={!canUnlink || isLoading}
                onClick={() => handleUnlink(id)}
              >
                <FontAwesomeIcon icon={faLinkSlash} />
                {isLoading ? t("connections.unlinking") : t("connections.unlink")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => handleLink(id, getInstance)}
              >
                <FontAwesomeIcon icon={faLink} />
                {isLoading ? t("connections.linking") : t("connections.link")}
              </Button>
            )}
          </div>
        );
      })}
      {!canUnlink && (
        <p className="text-xs text-muted-foreground">{t("connections.cannotUnlink")}</p>
      )}
    </div>
  );
}
