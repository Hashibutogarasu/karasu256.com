'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Code2, Layers, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsSidebar, SettingsSidebarLayout, toast, type SidebarNavItem, type SettingsSidebarUser } from '@Hashibutogarasu/ui';
import { signOutAction } from '@Hashibutogarasu/utils/server/sign-out';
import { listAccounts, switchAccount, removeAccount, type AccountSummary } from '@/lib/api/accounts-proxy';

const NAV_ITEMS_DEFS = [
  { href: '/settings/profile', icon: User, labelKey: 'settings.sections.profile' },
  { href: '/settings/other', icon: Layers, labelKey: 'settings.sections.other' },
  { href: '/settings/developer', icon: Code2, labelKey: 'settings.sections.developer' },
] as const;

interface SettingsShellProps {
  children: React.ReactNode;
  user: SettingsSidebarUser | null;
}

/**
 * Client-side settings shell. Provides i18n-aware nav items with Next.js client-side links.
 */
export function SettingsShell({ children, user }: SettingsShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);

  const refreshAccounts = useCallback(async () => {
    try {
      const result = await listAccounts();
      setAccounts(result.accounts.filter((a) => a.uid !== user?.uid));
    } catch {
      /* noop — account switcher is a non-critical enhancement */
    }
  }, [user?.uid]);

  useEffect(() => {
    void refreshAccounts();
  }, [refreshAccounts]);

  async function handleSwitchAccount(uid: string) {
    const target = accounts.find((a) => a.uid === uid);
    if (!target) return;
    try {
      await switchAccount(target.sessionToken);
      router.refresh();
      void refreshAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRemoveAccount(uid: string) {
    const target = accounts.find((a) => a.uid === uid);
    if (!target) return;
    try {
      await removeAccount(target.sessionToken);
      void refreshAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  function handleAddAccount() {
    window.location.href = `${process.env.NEXT_PUBLIC_ACCOUNTS_URL}/settings?addAccount=1`;
  }

  const navItems: SidebarNavItem[] = NAV_ITEMS_DEFS.map(({ href, icon, labelKey }) => ({
    href,
    icon,
    label: t(labelKey),
  }));

  const activeIndex = NAV_ITEMS_DEFS.findIndex(({ href }) => pathname === href || pathname.startsWith(href + '/'));

  return (
    <SettingsSidebarLayout
      sidebar={
        <SettingsSidebar
          title={t('settings.title')}
          navItems={navItems}
          activeIndex={activeIndex}
          user={user}
          onSignOut={signOutAction}
          signOutLabel={t('settings.signOut')}
          accounts={accounts}
          onSwitchAccount={handleSwitchAccount}
          onAddAccount={handleAddAccount}
          onRemoveAccount={handleRemoveAccount}
          addAccountLabel={t('settings.accountSwitcher.addAccount')}
          removeAccountLabel={t('settings.accountSwitcher.removeAccount')}
          renderLink={({ href, className, title, 'aria-current': ariaCurrent, children }) => (
            <Link href={href} className={className} title={title} aria-current={ariaCurrent}>
              {children}
            </Link>
          )}
        />
      }
    >
      {children}
    </SettingsSidebarLayout>
  );
}
