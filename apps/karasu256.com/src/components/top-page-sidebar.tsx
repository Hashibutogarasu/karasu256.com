'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarTrigger, SidebarRail } from '@Hashibutogarasu/ui';

export interface TopPageSidebarProps {
  children?: ReactNode;
}

/**
 * Home-page sidebar, separate from the settings sidebar. Unlike
 * `SettingsSidebar`, it has no footer-pinned account menu — items are
 * rendered as plain `SidebarMenuItem`s in the normal content flow.
 */
export function TopPageSidebar({ children }: TopPageSidebarProps) {
  const t = useTranslations();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1">
          <SidebarTrigger className="shrink-0" />
          <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">{t('home.sidebar.title')}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>{children && <SidebarMenuItem>{children}</SidebarMenuItem>}</SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
