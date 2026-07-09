import * as React from 'react';
import { cn } from '../lib/utils';
import './overlay-container.css';

export interface OverlayContainerProps {
  /** Whether the overlay is visible. Stays mounted while closed so toggling this fades it in/out. */
  open: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-screen overlay that sits above the rest of the page (including
 * popups/dialogs) on a dimmed, blurred backdrop, centering its children.
 * Fades its opacity in/out via `overlay-container.css` as `open` toggles.
 */
export function OverlayContainer({ open, children, className }: OverlayContainerProps) {
  return (
    <div
      data-open={open ? '' : undefined}
      className={cn('overlay-container fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm', className)}
    >
      {children}
    </div>
  );
}
