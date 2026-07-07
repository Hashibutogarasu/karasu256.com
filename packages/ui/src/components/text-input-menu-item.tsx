'use client';

import * as React from 'react';
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
 * A plain row (deliberately not a `Menu.Item`) holding a text input, for
 * entering a custom value inline without closing the menu. Base UI's Menu
 * attaches a root-level keydown listener for type-ahead search that
 * intercepts keystrokes bubbling from any descendant, including a `Menu.Item`
 * wrapping this input; rendering as a plain, non-item element keeps this row
 * out of the menu's composite item list, and the input additionally stops
 * propagation on every key as a second line of defense. Sticky positioning is
 * the caller's responsibility, not this component's.
 */
export function TextInputMenuItem({ value, onChange, onSubmit, placeholder, className, ...ariaProps }: TextInputMenuItemProps) {
  return (
    <div className={cn('flex items-center gap-1.5 rounded-md px-1.5 py-1', className)}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit(value);
          }
        }}
        {...ariaProps}
      />
    </div>
  );
}
