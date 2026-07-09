'use client';

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { clearSession, resyncSession } from '@/lib/api/auth-session';
import { listAccounts, switchAccount, removeAccount, type AccountSummary } from '@/lib/api/accounts';
import { getMainAppUrl } from '@/lib/get-main-app-url';
import { Skeleton, SettingsSidebarLayout, SwitchingAccountOverlay } from '@Hashibutogarasu/ui';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { AddAccountDialog } from '@/components/settings/add-account-dialog';
import { UserContext } from '@/components/settings/user-context';
import { ProfileSectionSkeleton } from '@/components/auth/settings/profile-section';

interface SettingsShellProps {
  children: React.ReactNode;
}

/**
 * Settings shell. Verifies Firebase auth state client-side and provides the
 * authenticated User via UserContext. Shows skeleton in main content while
 * auth resolves, except on /settings/linking which always renders its children
 * directly so the provider buttons can appear (disabled) without a skeleton,
 * and on /settings/profile which shows {@link ProfileSectionSkeleton} so only
 * the identicon and display name are skeletonized while the form stays disabled.
 *
 * When Firebase reports no client-side user, this does not immediately treat
 * it as a sign-out: client-side Firebase Auth persistence can be lost (e.g. a
 * browser evicting site storage across the cross-site redirect round trip
 * that `ProviderSection`'s "link account" flow drives through a social
 * provider and back to `/settings/linking`) while the server session cookie
 * is still valid. It first tries {@link resyncSession} to mint a fresh
 * custom token from that cookie and restore the client session, only
 * clearing the server session and redirecting away if that recovery fails too.
 */
export function SettingsShell({ children }: SettingsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [appUrl, setAppUrl] = useState<string>();
  const [switchingAccount, setSwitchingAccount] = useState(false);

  useEffect(() => {
    setAppUrl(getMainAppUrl());
  }, []);

  const isLinkingPage = pathname === '/settings/linking';
  const isProfilePage = pathname === '/settings/profile';

  const refreshAccounts = useCallback(async (activeUid: string | undefined) => {
    try {
      const result = await listAccounts();
      setAccounts(result.accounts.filter((a) => a.uid !== activeUid));
    } catch {
      /* noop — account switcher is a non-critical enhancement */
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (!u) {
        const customToken = await resyncSession();
        if (customToken) {
          try {
            await signInWithCustomToken(getFirebaseAuth(), customToken);
            return;
          } catch {
            /* fall through to sign-out below */
          }
        }
        await clearSession();
        router.replace('/');
      } else {
        try {
          await u.reload();
        } catch (_) {
          /* noop */
        }
        const current = getFirebaseAuth().currentUser ?? u;
        setUser(current);
        setLoading(false);
        void refreshAccounts(current.uid);
      }
    });
  }, [router, refreshAccounts]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('addAccount') === '1') {
      setAddDialogOpen(true);
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await clearSession();
    await signOut(getFirebaseAuth());
  }

  async function handleSwitchAccount(uid: string) {
    const target = accounts.find((a) => a.uid === uid);
    if (!target) return;
    setSwitchingAccount(true);
    try {
      const result = await switchAccount(target.sessionToken);
      await signInWithCustomToken(getFirebaseAuth(), result.customToken);
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
      void refreshAccounts(user?.uid);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  function renderContent() {
    if (isLinkingPage) {
      return <>{children}</>;
    }
    if (loading) {
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
      <UserContext.Provider
        key={user!.uid}
        value={{
          user: user!,
          updateUser: (patch) => setUser((u) => u && { ...u, ...patch }),
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }

  const sidebarUser = user
    ? {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }
    : null;

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
      <AddAccountDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdded={() => void refreshAccounts(user?.uid)} />
      <SwitchingAccountOverlay open={switchingAccount} message={t('settings.accountSwitcher.switchingAccount')} />
    </>
  );
}
