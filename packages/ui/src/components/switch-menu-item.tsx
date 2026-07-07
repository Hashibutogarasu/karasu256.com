'use client';

import * as React from 'react';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Switch } from './ui/switch';
import { cn } from '../lib/utils';

export interface SwitchMenuItemProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * A menu item that toggles a boolean setting via a `Switch`, without closing
 * the menu. The switch itself is display-only (`tabIndex={-1}` and
 * `pointer-events-none`); the row's own click drives the toggle instead, to
 * avoid a double-toggle from the switch's own click bubbling to the row.
 */
export function SwitchMenuItem({ checked, onCheckedChange, children, disabled, className }: SwitchMenuItemProps) {
  return (
    <DropdownMenuItem
      closeOnClick={false}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn('flex items-center justify-between gap-4', className)}
    >
      <span>{children}</span>
      <Switch checked={checked} onCheckedChange={() => {}} tabIndex={-1} className="pointer-events-none" />
    </DropdownMenuItem>
  );
}
