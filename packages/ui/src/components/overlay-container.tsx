import * as React from 'react';
import { cn } from '../lib/utils';

export interface OverlayContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-screen overlay that sits above the rest of the page (including
 * popups/dialogs) on a dimmed, blurred backdrop, centering its children.
 * Used to block interaction while a disruptive async flow is in progress.
 */
export function OverlayContainer({ children, className }: OverlayContainerProps) {
  return <div className={cn('fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm', className)}>{children}</div>;
}
