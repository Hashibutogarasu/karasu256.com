import * as React from 'react';
import { Card } from './card';
import { cn } from '../lib/utils';

/**
 * Card container shared across authentication and account-related screens.
 */
export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <Card className={cn('w-full', className)} {...props} />;
}
