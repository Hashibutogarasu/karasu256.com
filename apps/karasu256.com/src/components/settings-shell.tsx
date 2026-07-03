"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Layers, User } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SettingsSidebar,
  SettingsSidebarLayout,
  type SidebarNavItem,
  type SettingsSidebarUser,
} from "@Hashibutogarasu/ui";
import { signOutAction } from "@/app/actions/auth";

const NAV_ITEMS_DEFS = [
  { href: "/settings/profile", icon: User, labelKey: "settings.sections.profile" },
  { href: "/settings/other", icon: Layers, labelKey: "settings.sections.other" },
  { href: "/settings/developer", icon: Code2, labelKey: "settings.sections.developer" },
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
          user={user}
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
