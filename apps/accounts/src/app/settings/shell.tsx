"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { clearSession } from "@/lib/api/auth-session";
import { Skeleton, SettingsSidebarLayout } from "@Hashibutogarasu/ui";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { UserContext } from "@/components/settings/user-context";

interface SettingsShellProps {
  children: React.ReactNode;
  appUrl: string;
}

/**
 * Settings shell. Verifies Firebase auth state client-side and provides the
 * authenticated User via UserContext. Shows skeleton in main content while
 * auth resolves, except on /settings/linking which always renders its children
 * directly so the provider buttons can appear (disabled) without a skeleton.
 */
export function SettingsShell({ children, appUrl: _appUrl }: SettingsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isLinkingPage = pathname === "/settings/linking";

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (!u) {
        await clearSession();
        router.replace("/");
      } else {
        try { await u.reload() } catch (_) { /* noop */ }
        setUser(getFirebaseAuth().currentUser ?? u);
        setLoading(false);
      }
    });
  }, [router]);

  async function handleSignOut() {
    await clearSession();
    await signOut(getFirebaseAuth());
  }

  function renderContent() {
    if (isLinkingPage) {
      return <>{children}</>;
    }
    if (loading) {
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
    <SettingsSidebarLayout
      sidebar={
        <SettingsSidebar
          user={sidebarUser}
          onSignOut={handleSignOut}
        />
      }
    >
      {renderContent()}
    </SettingsSidebarLayout>
  );
}
