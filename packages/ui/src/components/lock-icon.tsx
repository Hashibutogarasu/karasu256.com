'use client';

import { CiLock, CiUnlock } from 'react-icons/ci';
import { cn } from '../lib/utils';

export interface LockIconProps {
  locked: boolean;
  onLockedChange: (locked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Padlock toggle button. Renders `CiLock` while `locked` and `CiUnlock`
 * otherwise; clicking calls `onLockedChange` with the flipped state, so the
 * caller decides what locking/unlocking actually does.
 */
export function LockIcon({ locked, onLockedChange, className, 'aria-label': ariaLabel }: LockIconProps) {
  const Icon = locked ? CiLock : CiUnlock;

  return (
    <button
      type="button"
      onClick={() => onLockedChange(!locked)}
      aria-pressed={locked}
      aria-label={ariaLabel ?? (locked ? 'Locked' : 'Unlocked')}
      className={cn(
        'flex size-6 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
