"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { clearSession } from "@/lib/api/auth-session";
import { Skeleton } from "@Hashibutogarasu/ui";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { UserContext } from "@/components/settings/user-context";

/**
 * Settings shell. Verifies Firebase auth state client-side and provides the
 * authenticated User via UserContext. Shows sidebar immediately; skeleton
 * appears in main content while auth resolves.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (!u) {
        await clearSession();
        router.replace("/");
      } else {
        try { await u.reload() } catch { /* best-effort; proceed with cached profile */ }
        setUser(getFirebaseAuth().currentUser ?? u);
        setLoading(false);
      }
    });
  }, [router]);

  async function handleSignOut() {
    await clearSession();
    await signOut(getFirebaseAuth());
  }

  return (
    <div className="flex flex-1">
      <SettingsSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-auto">
        <div className="px-6 py-8 lg:px-10">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <UserContext.Provider
              value={{
                user: user!,
                updateUser: (patch) => setUser((u) => u && { ...u, ...patch }),
              }}
            >
              {children}
            </UserContext.Provider>
          )}
        </div>
      </main>
    </div>
  );
}
