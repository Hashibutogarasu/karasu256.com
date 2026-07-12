'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';
import { listAccounts, switchAccount, removeAccount, type AccountSummary } from '@/lib/api/accounts';
import { Skeleton, SettingsSidebarLayout, SwitchingAccountOverlay } from '@Hashibutogarasu/ui';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { AddAccountDialog } from '@/components/settings/add-account-dialog';
import { UserContext, type SettingsUser } from '@/components/settings/user-context';
import { ProfileSectionSkeleton } from '@/components/auth/settings/profile-section';

interface SettingsShellProps {
  children: React.ReactNode;
  /**
   * "Back to app" URL, read server-side verbatim from `ROOT_APP_URL` (see
   * {@link getRootAppUrl}). That function throws when the env var is unset,
   * so `SettingsLayout` never renders this shell with a guessed or missing
   * URL.
   */
  appUrl: string;
}

/**
 * Settings shell. Reads the better-auth session client-side via
 * `authClient.useSession()` and provides the authenticated user via
 * UserContext. Shows skeleton in main content while the session resolves,
 * except on /settings/linking which always renders its children directly so
 * the provider buttons can appear (disabled) without a skeleton, and on
 * /settings/profile which shows {@link ProfileSectionSkeleton} so only the
 * identicon and display name are skeletonized while the form stays disabled.
 */
export function SettingsShell({ children, appUrl }: SettingsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session, isPending, refetch } = authClient.useSession();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  /** Tagged with the user it belongs to, so a switched-to account starts with no stale override (see {@link userOverride} below) without needing an effect. */
  const [userOverrideState, setUserOverrideState] = useState<{ userId?: string; patch: Partial<SettingsUser> }>({ patch: {} });

  const isLinkingPage = pathname === '/settings/linking';
  const isProfilePage = pathname === '/settings/profile';
  const loading = isPending;

  const refreshAccounts = useCallback(async (activeUid: string | undefined) => {
    try {
      const result = await listAccounts();
      setAccounts(result.accounts.filter((a) => a.uid !== activeUid));
    } catch {
      /* noop — account switcher is a non-critical enhancement */
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace('/');
      return;
    }
    const activeUid = session.user.id;
    listAccounts()
      .then((result) => setAccounts(result.accounts.filter((a) => a.uid !== activeUid)))
      .catch(() => {});
  }, [isPending, session, router]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('addAccount') === '1') {
      setAddDialogOpen(true);
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
  }

  async function handleSwitchAccount(uid: string) {
    const target = accounts.find((a) => a.uid === uid);
    if (!target) return;
    setSwitchingAccount(true);
    try {
      await switchAccount(target.sessionToken);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSwitchingAccount(false);
    }
  }

  async function handleRemoveAccount(uid: string) {
    const target = accounts.find((a) => a.uid === uid);
    if (!target) return;
    try {
      await removeAccount(target.sessionToken);
      void refreshAccounts(session?.user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const updateUser = useCallback(
    (patch: Partial<SettingsUser>) => {
      setUserOverrideState((prev) => ({
        userId: session?.user.id,
        patch: prev.userId === session?.user.id ? { ...prev.patch, ...patch } : patch,
      }));
    },
    [session?.user.id]
  );

  const contextValue = useMemo(() => {
    if (!session) return null;
    const userOverride = userOverrideState.userId === session.user.id ? userOverrideState.patch : {};
    return { user: { ...session.user, ...userOverride }, updateUser };
  }, [session, userOverrideState, updateUser]);

  const sidebarUser = useMemo(() => {
    if (!session) return null;
    return {
      uid: session.user.id,
      displayName: session.user.name,
      email: session.user.email,
      photoURL: session.user.image ?? null,
    };
  }, [session]);

  function renderContent() {
    if (isLinkingPage) {
      return <>{children}</>;
    }
    if (loading || !contextValue) {
      if (isProfilePage) {
        return <ProfileSectionSkeleton />;
      }
      return (
        <div className="space-y-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }
    return (
      <UserContext.Provider key={contextValue.user.id} value={contextValue}>
        {children}
      </UserContext.Provider>
    );
  }

  return (
    <>
      <SettingsSidebarLayout
        sidebar={
          <SettingsSidebar
            user={sidebarUser}
            appUrl={appUrl}
            onSignOut={handleSignOut}
            accounts={accounts}
            onSwitchAccount={handleSwitchAccount}
            onAddAccount={() => setAddDialogOpen(true)}
            onRemoveAccount={handleRemoveAccount}
          />
        }
      >
        {renderContent()}
      </SettingsSidebarLayout>
      <AddAccountDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdded={() => void refreshAccounts(session?.user.id)} />
      <SwitchingAccountOverlay open={switchingAccount} message={t('settings.accountSwitcher.switchingAccount')} />
    </>
  );
}
