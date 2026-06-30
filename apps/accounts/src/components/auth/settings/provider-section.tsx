"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getIdToken, onAuthStateChanged, type User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { toast, SettingsAccordion, SettingsItem, Spinner } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { listPasskeyCredentials } from "@/lib/api/passkey-credentials";
import { listLinkedProviders, unlinkProvider, type LinkedProvider } from "@/lib/api/providers";
import { Button } from "@Hashibutogarasu/ui";

const PROVIDERS = [
  { id: "google", label: "Google", icon: faGoogle },
  { id: "github", label: "GitHub", icon: faGithub },
] as const;

/**
 * Displays linked OAuth providers (Google, GitHub) with link/unlink controls.
 * Manages its own Firebase auth subscription so it can render immediately
 * without depending on UserContext, avoiding a skeleton overlay during load.
 * Linking redirects the browser to the provider via /api/auth/connect/[provider].
 * Unlinking removes the entry from the database without touching Firebase Auth.
 * Unlinking the last provider is blocked when the user has no registered passkeys.
 */
export function ProviderSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [linked, setLinked] = useState<LinkedProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const handledParamsRef = useRef<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), setAuthUser);
  }, []);

  useEffect(() => {
    const paramsKey = searchParams.toString();
    if (!paramsKey || handledParamsRef.current === paramsKey) return;
    handledParamsRef.current = paramsKey;

    const error = searchParams.get("error");
    const linkedProvider = searchParams.get("linked");

    if (error) {
      const key = `connections.error.${error}`;
      toast.error(t(key, { defaultValue: t("connections.error.unknown") }));
    } else if (linkedProvider) {
      toast.success(t("connections.linked", { provider: linkedProvider }), { duration: 1000 });
    }
    router.replace(pathname);
  }, [searchParams, t, router, pathname]);

  useEffect(() => {
    void listLinkedProviders()
      .then(setLinked)
      .catch(() => {})
      .finally(() => setLoadingProviders(false));

    const current = getFirebaseAuth().currentUser;
    if (!current) return;
    void getIdToken(current)
      .then((idToken) => listPasskeyCredentials(idToken))
      .then((creds) => setHasPasskeys(creds.length > 0))
      .catch(() => {});
  }, []);

  const linkedIds = new Set(linked.map((p) => p.provider));
  const hasPasswordProvider = (authUser?.providerData ?? []).some((p) => p.providerId === "password");
  const canUnlink = linked.length > 1 || hasPasskeys || hasPasswordProvider;

  function handleLink(providerId: string) {
    setLoading(providerId);
    window.location.href = `/api/auth/connect/${providerId}?redirectTo=/settings/linking`;
  }

  async function handleUnlink(providerId: string) {
    setLoading(providerId);
    try {
      await unlinkProvider(providerId);
      setLinked((prev) => prev.filter((p) => p.provider !== providerId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <SettingsAccordion title={t("connections.title")}>
      <div className="space-y-3">
        {PROVIDERS.map(({ id, label, icon }) => {
          const isLinked = linkedIds.has(id);
          const isLoading = loading === id;
          return (
            <SettingsItem key={id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={icon} />
                {label}
              </span>
              {isLinked ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!canUnlink || isLoading || loadingProviders}
                  onClick={() => handleUnlink(id)}
                >
                  {isLoading || loadingProviders ? <Spinner /> : <FontAwesomeIcon icon={faLinkSlash} />}
                  {isLoading ? t("connections.unlinking") : t("connections.unlink")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || loadingProviders}
                  onClick={() => handleLink(id)}
                >
                  {isLoading || loadingProviders ? <Spinner /> : <FontAwesomeIcon icon={faLink} />}
                  {t("connections.link")}
                </Button>
              )}
            </SettingsItem>
          );
        })}
        {!canUnlink && (
          <p className="text-xs text-muted-foreground">{t("connections.cannotUnlink")}</p>
        )}
      </div>
    </SettingsAccordion>
  );
}
