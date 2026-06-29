"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

export interface SidebarNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface SettingsSidebarProps {
  title: string;
  navItems: SidebarNavItem[];
  /** Zero-based index of the currently active nav item. -1 if none. */
  activeIndex: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBack?: () => void;
  backLabel?: string;
  onSignOut: () => void;
  signOutLabel: string;
  /**
   * Renders a navigation link for each nav item.
   * The consumer is responsible for the link element (e.g. Next.js `Link` or `<a>`).
   */
  renderLink: (props: {
    href: string;
    className: string;
    title?: string;
    "aria-current"?: "page";
    children: React.ReactNode;
  }) => React.ReactNode;
}

/**
 * Collapsible navigation sidebar for settings pages.
 * Active item is derived from {@link SettingsSidebarProps.activeIndex}.
 * The sliding indicator tracks the active item via translateY.
 * Icons always sit at px-3 from the left so they don't shift on collapse.
 */
export function SettingsSidebar({
  title,
  navItems,
  activeIndex,
  collapsed,
  onToggleCollapse,
  onBack,
  backLabel,
  onSignOut,
  signOutLabel,
  renderLink,
}: SettingsSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background shrink-0",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center h-14 px-3 border-b border-border gap-2 overflow-hidden">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          aria-label={title}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
        {!collapsed && (
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
        )}
      </div>

      <nav className="flex-1 p-2 overflow-hidden">
        <div className="relative">
          {activeIndex >= 0 && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 rounded-md bg-muted pointer-events-none"
              style={{
                height: "2.5rem",
                boxShadow: "0 1px 4px oklch(0 0 0 / 0.12), 0 0 0 1px oklch(0 0 0 / 0.04)",
                transform: `translateY(calc(${activeIndex} * 2.5rem))`,
                transition: "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          )}
          {navItems.map(({ href, icon: Icon, label }, idx) => {
            const isActive = idx === activeIndex;
            return (
              <React.Fragment key={href}>
                {renderLink({
                  href,
                  className: cn(
                    "relative z-10 flex items-center w-full h-10 rounded-md text-sm",
                    "transition-colors px-3 gap-3 overflow-hidden",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  ),
                  title: collapsed ? label : undefined,
                  "aria-current": isActive ? "page" : undefined,
                  children: (
                    <>
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </>
                  ),
                })}
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-border overflow-hidden">
        {onBack ? (
          <div className={cn("flex w-full gap-2", collapsed ? "flex-col" : "flex-row")}>
            <button
              type="button"
              onClick={onBack}
              title={backLabel}
              className={cn(
                "flex flex-1 items-center h-10 rounded-md text-sm px-3 gap-3",
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer",
                collapsed ? "justify-center" : "justify-start",
              )}
            >
              <ArrowLeft className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{backLabel}</span>}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              title={signOutLabel}
              className={cn(
                "flex flex-1 items-center h-10 rounded-md text-sm px-3 gap-3",
                "text-destructive hover:bg-destructive/10 transition-colors cursor-pointer",
                collapsed ? "justify-center" : "justify-start",
              )}
            >
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{signOutLabel}</span>}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            title={collapsed ? signOutLabel : undefined}
            className="flex items-center w-full h-10 rounded-md text-sm px-3 gap-3 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer overflow-hidden"
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{signOutLabel}</span>}
          </button>
        )}
      </div>
    </aside>
  );
}

export interface SettingsSidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Flex wrapper that places a sidebar on the left and scrollable content on the right.
 * Designed to be used as a direct flex child of a full-height container.
 */
export function SettingsSidebarLayout({ sidebar, children }: SettingsSidebarLayoutProps) {
  return (
    <div className="flex flex-1">
      {sidebar}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
