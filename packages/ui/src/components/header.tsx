import * as React from 'react';
import { cn } from '../lib/utils';

export interface HeaderProps {
  /** Leading site title/logo slot. */
  logo: React.ReactNode;
  /** Trailing nav content, e.g. an account menu or sign-in button. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Site-wide sticky header shell shared across apps. Purely presentational —
 * callers fetch their own session data and pass the result in via props.
 */
export function Header({ logo, children, className }: HeaderProps) {
  return (
    <header
      className={cn('sticky top-0 z-20 bg-background w-full h-12 px-6 flex justify-between items-center border-b border-border shrink-0', className)}
    >
      <div className="font-bold text-xl">{logo}</div>
      <nav>
        <ul className="flex gap-6">
          <li>{children}</li>
        </ul>
      </nav>
    </header>
  );
}
