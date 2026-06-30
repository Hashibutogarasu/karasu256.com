"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { toast, SettingsAccordion, SettingsItem, Spinner } from "@Hashibutogarasu/ui";
import { unlinkProvider } from "@/lib/api/providers";
import { Button } from "@Hashibutogarasu/ui";
import { useProviderSection } from "@/hooks/use-provider-section";

const PROVIDERS = [
  { id: "google", label: "Google", icon: faGoogle },
  { id: "github", label: "GitHub", icon: faGithub },
] as const;

/**
 * Displays linked OAuth providers (Google, GitHub) with link/unlink controls.
 * Linking redirects the browser to the provider via /api/auth/connect/[provider].
 * Unlinking removes the entry from the database without touching Firebase Auth.
 * Unlinking the last provider is blocked when the user has no registered passkeys.
 */
export function ProviderSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledParamsRef = useRef<string | null>(null);

  const { authUser, linked, setLinked, hasPasskeys, loading, setLoading, dataReady } =
    useProviderSection();

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
                  disabled={!canUnlink || isLoading || !dataReady}
                  onClick={() => handleUnlink(id)}
                >
                  {isLoading || !dataReady ? <Spinner /> : <FontAwesomeIcon icon={faLinkSlash} />}
                  {isLoading ? t("connections.unlinking") : t("connections.unlink")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || !dataReady}
                  onClick={() => handleLink(id)}
                >
                  {isLoading || !dataReady ? <Spinner /> : <FontAwesomeIcon icon={faLink} />}
                  {t("connections.link")}
                </Button>
              )}
            </SettingsItem>
          );
        })}
        {dataReady && !canUnlink && (
          <p className="text-xs text-muted-foreground">{t("connections.cannotUnlink")}</p>
        )}
      </div>
    </SettingsAccordion>
  );
}
