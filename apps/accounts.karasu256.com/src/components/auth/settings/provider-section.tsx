'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faLinkSlash } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTranslations } from 'next-intl';
import { toast, SettingsAccordion, SettingsItem, Spinner } from '@Hashibutogarasu/ui';
import { unlinkProvider } from '@Hashibutogarasu/utils/client';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { authClient, bridgeFirebaseSession } from '@/lib/auth/client';
import { Button } from '@Hashibutogarasu/ui';

export interface Provider {
  id: string;
  label: string;
  icon: IconDefinition;
}

interface ProviderSectionProps {
  providers: Provider[];
  initialProviders: string[];
}

/**
 * Displays linked OAuth providers with link/unlink controls.
 *
 * Linking first calls the Firebase session bridge (`/api/auth/firebase-bridge`)
 * to establish a better-auth session for the current Firebase user, then
 * hands off to `authClient.linkSocial`, which drives the OAuth handshake.
 * Unlinking removes the entry from `packages/db`'s `accounts` table without
 * touching Firebase Auth.
 * Unlinking the last provider is blocked when the user has no registered passkeys.
 */
export function ProviderSection({ providers, initialProviders }: ProviderSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [linked, setLinked] = useState<string[]>(initialProviders);
  const [loading, setLoading] = useState<string | null>(null);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const handledParamsRef = useRef<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setAuthUser(user);
      setLoadingAuth(false);
    });
  }, []);

  useEffect(() => {
    const paramsKey = searchParams.toString();
    if (!paramsKey || handledParamsRef.current === paramsKey) return;
    handledParamsRef.current = paramsKey;

    const error = searchParams.get('error');
    const linkedProvider = searchParams.get('linked');

    if (error) {
      const key = `connections.error.${error}`;
      toast.error(t.has(key) ? t(key) : t('connections.error.unknown'));
    } else if (linkedProvider) {
      toast.success(t('connections.linked', { provider: linkedProvider }), { autoClose: true });
    }
    router.replace(pathname);
  }, [searchParams, t, router, pathname]);

  useEffect(() => {
    void authClient.passkey
      .listUserPasskeys()
      .then(({ data }) => setHasPasskeys((data?.length ?? 0) > 0))
      .catch(() => {});
  }, []);

  const dataReady = !loadingAuth;
  const linkedIds = new Set(linked);
  const hasPasswordProvider = (authUser?.providerData ?? []).some((p) => p.providerId === 'password');
  const canUnlink = linked.length > 1 || hasPasskeys || hasPasswordProvider;

  async function handleLink(providerId: string) {
    setLoading(providerId);
    try {
      await bridgeFirebaseSession();
      const { error } = await authClient.linkSocial({
        provider: providerId,
        callbackURL: '/settings/linking',
        errorCallbackURL: '/settings/linking',
      });
      if (error) {
        const key = `connections.error.${error.code?.toLowerCase()}`;
        toast.error(t.has(key) ? t(key) : t('connections.error.unknown'));
        setLoading(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setLoading(null);
    }
  }

  async function handleUnlink(providerId: string) {
    setLoading(providerId);
    try {
      await unlinkProvider(providerId);
      setLinked((prev) => prev.filter((p) => p !== providerId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <SettingsAccordion title={t('connections.title')}>
      <div className="space-y-3">
        {providers.map(({ id, label, icon }) => {
          const isLinked = linkedIds.has(id);
          const isLoading = loading === id;
          return (
            <SettingsItem key={id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={icon} />
                {label}
              </span>
              {isLinked ? (
                <Button variant="destructive" size="sm" disabled={!canUnlink || isLoading || !dataReady} onClick={() => handleUnlink(id)}>
                  {isLoading || !dataReady ? <Spinner /> : <FontAwesomeIcon icon={faLinkSlash} />}
                  {isLoading ? t('connections.unlinking') : t('connections.unlink')}
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled={isLoading || !dataReady} onClick={() => handleLink(id)}>
                  {isLoading || !dataReady ? <Spinner /> : <FontAwesomeIcon icon={faLink} />}
                  {t('connections.link')}
                </Button>
              )}
            </SettingsItem>
          );
        })}
        {dataReady && !canUnlink && <p className="text-xs text-muted-foreground">{t('connections.cannotUnlink')}</p>}
      </div>
    </SettingsAccordion>
  );
}
