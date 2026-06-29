"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Link as LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsSidebar as UiSettingsSidebar, type SidebarNavItem } from "@Hashibutogarasu/ui";

const NAV_ITEMS_DEFS = [
  { href: "/settings/profile", icon: User, labelKey: "settings.sections.profile" },
  { href: "/settings/security", icon: Shield, labelKey: "settings.sections.security" },
  { href: "/settings/linking", icon: LinkIcon, labelKey: "settings.sections.connections" },
] as const;

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBack: () => void;
  onSignOut: () => void;
}

/**
 * Accounts-specific settings sidebar. Wraps {@link UiSettingsSidebar} with
 * translated labels, active-path detection, and Next.js client-side links.
 */
export function SettingsSidebar({ collapsed, onToggleCollapse, onBack, onSignOut }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navItems: SidebarNavItem[] = NAV_ITEMS_DEFS.map(({ href, icon, labelKey }) => ({
    href,
    icon,
    label: t(labelKey),
  }));

  const activeIndex = NAV_ITEMS_DEFS.findIndex(({ href }) => pathname.startsWith(href));

  return (
    <UiSettingsSidebar
      title={t("settings.title")}
      navItems={navItems}
      activeIndex={activeIndex}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onBack={onBack}
      backLabel={t("settings.back")}
      onSignOut={onSignOut}
      signOutLabel={t("settings.signOut")}
      renderLink={({ href, className, title, "aria-current": ariaCurrent, children }) => (
        <Link href={href} className={className} title={title} aria-current={ariaCurrent}>
          {children}
        </Link>
      )}
    />
  );
}
