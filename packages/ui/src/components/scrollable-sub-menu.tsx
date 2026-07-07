'use client';

import * as React from 'react';
import { DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './ui/dropdown-menu';
import { cn } from '../lib/utils';

export interface ScrollableSubMenuProps {
  trigger: React.ReactNode;
  pinned?: React.ReactNode;
  onLoadMore: () => void;
  triggerClassName?: string;
  /**
   * CSS `max-height` value for the popup. Defaults to 70% of the viewport
   * height, capped at `--available-height` (the space actually free between
   * the trigger and the viewport edge) so it never overflows the screen.
   */
  maxHeight?: string;
  children: React.ReactNode;
}

/**
 * A `MenuSub` whose content grows on demand as it's scrolled: once
 * `children` no longer fills the popup (or the user scrolls to the bottom
 * of it), `onLoadMore` is called so the caller can append more items.
 * `highlightItemOnHover={false}` and `openOnHover={false}` are baked in
 * because a plain `MenuSub`/`MenuSubTrigger` fights hover-driven focus and
 * scroll interactions inside a growing list — see this app's git history
 * for the regressions that motivated them.
 *
 * `IntersectionObserver` only reports *changes* in intersection, not the
 * mere fact of being visible. Right after the popup opens, `children` is
 * usually shorter than the popup, so the sentinel below it is already
 * visible; if `onLoadMore` appends just one batch, the sentinel often stays
 * visible and no crossing ever happens again, permanently starving the
 * list. Re-registering the observer on the sentinel on every render forces
 * a fresh notification for its current intersection state (a new
 * `observe()` call always reports the current state per spec), so loading
 * keeps going until the sentinel genuinely leaves the popup's visible
 * bounds — at which point real scrolling takes over as expected.
 *
 * The sentinel is wired up through a callback ref rather than a plain
 * `useRef` + mount-only `useEffect`: `MenuSubContent`'s children (and thus
 * the sentinel) only enter the DOM once the submenu itself opens, which
 * happens well after `ScrollableSubMenu` — the component that owns
 * `MenuSub` — first mounts. A mount-only effect would find the ref still
 * null and never retry; the callback ref instead sets everything up exactly
 * when the sentinel node actually appears.
 */
export function ScrollableSubMenu({
  trigger,
  pinned,
  onLoadMore,
  triggerClassName,
  maxHeight = 'min(70vh, var(--available-height))',
  children,
}: ScrollableSubMenuProps) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const attachSentinel = React.useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    sentinelRef.current = node;
    if (!node) return;

    const root = node.closest<HTMLElement>('[data-slot="dropdown-menu-sub-content"]');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { root }
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    const observer = observerRef.current;
    if (!sentinel || !observer) return;

    observer.unobserve(sentinel);
    observer.observe(sentinel);
  });

  return (
    <DropdownMenuSub highlightItemOnHover={false}>
      <DropdownMenuSubTrigger openOnHover={false} className={cn('hover:bg-accent hover:text-accent-foreground', triggerClassName)}>
        {trigger}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent style={{ maxHeight }}>
        {pinned && <div className="sticky top-0 z-10 bg-popover">{pinned}</div>}
        {children}
        <div ref={attachSentinel} aria-hidden="true" className="h-px" />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
