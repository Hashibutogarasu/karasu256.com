'use client';

import * as React from 'react';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Input } from './input';
import { cn } from '../lib/utils';

export interface TextInputMenuItemProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * A menu item holding a text input, for entering a custom value inline
 * without closing the menu. Arrow key presses are kept from the menu's
 * roving focus so they move the text cursor instead of the menu highlight.
 * Sticky positioning is the caller's responsibility, not this component's.
 */
export function TextInputMenuItem({ value, onChange, onSubmit, placeholder, className, ...ariaProps }: TextInputMenuItemProps) {
  return (
    <DropdownMenuItem closeOnClick={false} render={<div />} className={cn('flex', className)}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.stopPropagation();
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit(value);
          }
        }}
        {...ariaProps}
      />
    </DropdownMenuItem>
  );
}
