"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SettingsSidebar,
  SettingsSidebarLayout,
  type SidebarNavItem,
} from "@Hashibutogarasu/ui";
import { signOutAction } from "@/app/actions/auth";

const NAV_ITEMS_DEFS = [
  { href: "/settings/profile", icon: User, labelKey: "settings.sections.profile" },
  { href: "/settings/developer", icon: Code2, labelKey: "settings.sections.developer" },
] as const;

/**
 * Client-side settings shell. Manages sidebar collapsed state and provides
 * i18n-aware nav items with Next.js client-side links.
 */
export function SettingsShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: SidebarNavItem[] = NAV_ITEMS_DEFS.map(({ href, icon, labelKey }) => ({
    href,
    icon,
    label: t(labelKey),
  }));

  const activeIndex = NAV_ITEMS_DEFS.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(href + "/"),
  );

  return (
    <SettingsSidebarLayout
      sidebar={
        <SettingsSidebar
          title={t("settings.title")}
          navItems={navItems}
          activeIndex={activeIndex}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onSignOut={signOutAction}
          signOutLabel={t("settings.signOut")}
          renderLink={({ href, className, title, "aria-current": ariaCurrent, children }) => (
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
