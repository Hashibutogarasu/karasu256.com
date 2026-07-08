'use client';

import * as React from 'react';
import { ChevronsUpDown, ExternalLink, LogOut, Plus, X, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Skeleton } from './skeleton';
import { UserAvatar } from './user-avatar';

export interface SidebarNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface SettingsSidebarUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface SettingsSidebarProps {
  title: string;
  navItems: SidebarNavItem[];
  /** Zero-based index of the currently active nav item. -1 if none. */
  activeIndex: number;
  user: SettingsSidebarUser | null;
  backToAppHref?: string;
  backToAppLabel?: string;
  onSignOut: () => void;
  signOutLabel: string;
  /** Other accounts added on this device, excluding the active `user`. Omit/empty to hide the account-switcher section entirely. */
  accounts?: SettingsSidebarUser[];
  /** Invoked with the uid of the account to switch to. */
  onSwitchAccount?: (uid: string) => void;
  /** Invoked when the user wants to add another account. */
  onAddAccount?: () => void;
  /** Invoked with the uid of an account the user wants to remove from this device (the active one keeps using the plain sign-out button instead). */
  onRemoveAccount?: (uid: string) => void;
  /** Label for the "add another account" menu item. Required when `onAddAccount` is provided. */
  addAccountLabel?: string;
  /** Screen-reader label for a "remove this account" control shown next to each other account. Required when `onRemoveAccount` is provided. */
  removeAccountLabel?: string;
  /**
   * Renders a navigation link for each nav item.
   * The consumer is responsible for the link element (e.g. Next.js `Link` or `<a>`).
   */
  renderLink: (props: { href: string; className: string; title?: string; 'aria-current'?: 'page'; children: React.ReactNode }) => React.ReactNode;
}

/**
 * Collapsible navigation sidebar for settings pages backed by shadcn Sidebar primitives.
 * On desktop it collapses to icon-only mode. On mobile it renders as a Sheet overlay.
 * The footer shows a profile card that opens a popup user menu on click.
 */
export function SettingsSidebar({
  title,
  navItems,
  activeIndex,
  user,
  backToAppHref,
  backToAppLabel,
  onSignOut,
  signOutLabel,
  accounts,
  onSwitchAccount,
  onAddAccount,
  onRemoveAccount,
  addAccountLabel,
  removeAccountLabel,
  renderLink,
}: SettingsSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1">
          <SidebarTrigger className="shrink-0" />
          <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">{title}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavSection navItems={navItems} activeIndex={activeIndex} renderLink={renderLink} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarUserMenu
          user={user}
          backToAppHref={backToAppHref}
          backToAppLabel={backToAppLabel}
          onSignOut={onSignOut}
          signOutLabel={signOutLabel}
          accounts={accounts}
          onSwitchAccount={onSwitchAccount}
          onAddAccount={onAddAccount}
          onRemoveAccount={onRemoveAccount}
          addAccountLabel={addAccountLabel}
          removeAccountLabel={removeAccountLabel}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

interface NavSectionProps {
  navItems: SidebarNavItem[];
  activeIndex: number;
  renderLink: SettingsSidebarProps['renderLink'];
}

/**
 * Navigation item list.
 *
 * Items are always h-8 p-2 — identical in expanded and collapsed mode.
 * Because nothing about the item's own size or padding ever changes:
 *   • the icon never shifts (it is always centred in p-2 space)
 *   • the indicator translateY factor is always 2rem — it never animates
 *   • in collapsed (32 px wide container) the indicator is 32×32 px: a perfect square
 *     centred on the icon
 *   • in expanded the indicator is full-width × 32 px (the original slide style)
 */
function NavSection({ navItems, activeIndex, renderLink }: NavSectionProps) {
  const { state, isMobile } = useSidebar();
  const isIconMode = state === 'collapsed' && !isMobile;

  return (
    <SidebarGroup>
      <div className="relative">
        {activeIndex >= 0 && (
          <div
            aria-hidden="true"
            className={cn('absolute inset-x-0 h-8 rounded-md pointer-events-none', isIconMode ? 'bg-sidebar-accent' : 'bg-muted')}
            style={{
              boxShadow: isIconMode ? undefined : '0 1px 4px oklch(0 0 0 / 0.12), 0 0 0 1px oklch(0 0 0 / 0.04)',
              transform: `translateY(calc(${activeIndex} * 2rem))`,
              transition: 'transform 240ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {navItems.map((item, idx) => (
          <NavItem key={item.href} item={item} isActive={idx === activeIndex} isIconMode={isIconMode} renderLink={renderLink} />
        ))}
      </div>
    </SidebarGroup>
  );
}

interface NavItemProps {
  item: SidebarNavItem;
  isActive: boolean;
  isIconMode: boolean;
  renderLink: SettingsSidebarProps['renderLink'];
}

function NavItem({ item, isActive, isIconMode, renderLink }: NavItemProps) {
  const linkEl = renderLink({
    href: item.href,
    /*
     * h-8 p-2 gap-2 in both modes — nothing changes on toggle so the icon
     * never shifts. In collapsed (32 px container) p-2 centres the 16 px
     * icon at 8+8 = 16 px = container centre, matching the square indicator.
     */
    className: cn(
      'relative z-10 flex items-center w-full h-8 rounded-md text-sm',
      'transition-colors overflow-hidden p-2 gap-2',
      isActive
        ? cn('text-foreground font-medium', 'group-data-[collapsible=icon]:text-sidebar-accent-foreground')
        : cn('text-muted-foreground hover:text-foreground', 'group-data-[collapsible=icon]:hover:bg-sidebar-accent/50')
    ),
    'aria-current': isActive ? 'page' : undefined,
    children: (
      <>
        <item.icon className="size-4 shrink-0" />
        <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
      </>
    ),
  });

  if (!isIconMode) {
    return <>{linkEl}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={linkEl as React.ReactElement} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

interface SidebarUserMenuProps {
  user: SettingsSidebarUser | null;
  backToAppHref?: string;
  backToAppLabel?: string;
  onSignOut: () => void;
  signOutLabel: string;
  accounts?: SettingsSidebarUser[];
  onSwitchAccount?: (uid: string) => void;
  onAddAccount?: () => void;
  onRemoveAccount?: (uid: string) => void;
  addAccountLabel?: string;
  removeAccountLabel?: string;
}

function SidebarUserMenu({
  user,
  backToAppHref,
  backToAppLabel,
  onSignOut,
  signOutLabel,
  accounts,
  onSwitchAccount,
  onAddAccount,
  onRemoveAccount,
  addAccountLabel,
  removeAccountLabel,
}: SidebarUserMenuProps) {
  const { state, isMobile } = useSidebar();
  const isIconMode = state === 'collapsed' && !isMobile;

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 h-12 px-2 overflow-hidden">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-1 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const displayName = user.displayName ?? user.email?.split('@')[0] ?? '';
  const tooltipLabel = displayName || user.email || '';

  const trigger = (
    <DropdownMenuTrigger
      className={cn(
        'flex w-full items-center gap-2 overflow-hidden rounded-md text-sm text-left cursor-pointer',
        'transition-colors outline-none ring-sidebar-ring',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'h-12 px-2'
      )}
    >
      <UserAvatar uid={user.uid} iconUrl={user.photoURL} size={32} />
      <div className="grid flex-1 min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-semibold">{displayName}</span>
        <span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
      </div>
      <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      <SidebarMenu>
        <SidebarMenuItem>
          {isIconMode ? (
            <Tooltip>
              <TooltipTrigger render={trigger} />
              <TooltipContent side="right">{tooltipLabel}</TooltipContent>
            </Tooltip>
          ) : (
            trigger
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <DropdownMenuPortal>
        <DropdownMenuPositioner side="top" align="start" sideOffset={4}>
          <DropdownMenuPopup>
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            {backToAppLabel && (
              <DropdownMenuItem disabled={!backToAppHref} {...(backToAppHref ? { render: <a href={backToAppHref} /> } : {})}>
                <ExternalLink className="size-4" />
                {backToAppLabel}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="size-4" />
              {signOutLabel}
            </DropdownMenuItem>
            {accounts && accounts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {accounts.map((account) => {
                  const accountName = account.displayName ?? account.email?.split('@')[0] ?? '';
                  return (
                    <DropdownMenuItem key={account.uid} className="gap-2" onClick={() => onSwitchAccount?.(account.uid)}>
                      <UserAvatar uid={account.uid} iconUrl={account.photoURL} size={20} />
                      <div className="grid flex-1 min-w-0 leading-tight">
                        <span className="truncate text-sm">{accountName}</span>
                        <span className="truncate text-xs text-muted-foreground">{account.email}</span>
                      </div>
                      {onRemoveAccount && (
                        <button
                          type="button"
                          aria-label={removeAccountLabel}
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveAccount(account.uid);
                          }}
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
            {onAddAccount && (
              <DropdownMenuItem onClick={onAddAccount}>
                <Plus className="size-4" />
                {addAccountLabel}
              </DropdownMenuItem>
            )}
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export interface SettingsSidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Full-page layout that wraps the settings sidebar and content in a SidebarProvider.
 * On mobile a trigger button appears at the top of the content area to open the sidebar.
 */
export function SettingsSidebarLayout({ sidebar, children }: SettingsSidebarLayoutProps) {
  return (
    <SidebarProvider className="flex-1 items-start" style={{ minHeight: 0 }}>
      {sidebar}
      <SidebarInset className="overflow-auto min-h-0">
        <div className="flex md:hidden items-center h-12 px-4 border-b border-border shrink-0">
          <SidebarTrigger />
        </div>
        <div className="px-6 py-8 lg:px-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
