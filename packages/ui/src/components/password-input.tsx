'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { cn } from '../lib/utils';

export type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

/**
 * Password input with a show/hide visibility toggle button.
 * Accepts all standard input props except `type`, which is managed internally.
 */
function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-9', className)} {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 h-full w-9 hover:bg-transparent"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
      </Button>
    </div>
  );
}

export { PasswordInput };
