'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
  useDragAndDrop,
  useSidebar,
  type DragPayload,
} from '@Hashibutogarasu/ui';

export interface TopPageSidebarProps {
  children?: ReactNode;
  onDrop?: (_payload: DragPayload) => void;
  /** Rendered on the right side of the title row, e.g. a `LockIcon`. */
  titleActions?: ReactNode[];
}

/**
 * Home-page sidebar, separate from the settings sidebar. Unlike
 * `SettingsSidebar`, it has no footer-pinned account menu — items are
 * rendered as plain `SidebarMenuItem`s in the normal content flow. Also
 * registers itself as a drop target so an item dragged out of a pane can be
 * returned here. Hovering anywhere on the sidebar counts, but the geometry
 * handed to the drag context is measured from the small item slot, not the
 * whole (viewport-tall) sidebar, so the floating ghost morphs to a
 * reasonably sized shape instead of the sidebar's full height. On mobile the
 * sidebar renders as a modal sheet whose full-viewport backdrop sits above
 * the main content, so it auto-closes as soon as a drag starts — otherwise
 * the backdrop would keep swallowing the pointer events the drop targets
 * need to detect a hover.
 */
export function TopPageSidebar({ children, onDrop, titleActions }: TopPageSidebarProps) {
  const t = useTranslations();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const { isDragging, registerHover, clearHover } = useDragAndDrop();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isDragging && isMobile && openMobile) {
      setOpenMobile(false);
    }
  }, [isDragging, isMobile, openMobile, setOpenMobile]);

  function handlePointerEnter() {
    if (!isDragging || !slotRef.current) return;
    const rect = slotRef.current.getBoundingClientRect();
    const borderRadius = getComputedStyle(slotRef.current).borderRadius;
    registerHover({ id: 'sidebar', rect, borderRadius, onDrop });
  }

  function handlePointerLeave() {
    clearHover('sidebar');
  }

  return (
    <Sidebar collapsible="icon" ref={sidebarRef} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1">
          <SidebarTrigger className="shrink-0" />
          <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">{t('home.sidebar.title')}</span>
          {titleActions && titleActions.length > 0 && (
            <div className="ml-auto flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:hidden">{titleActions}</div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <div ref={slotRef} className="h-10 w-full rounded-md">
                {children}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
