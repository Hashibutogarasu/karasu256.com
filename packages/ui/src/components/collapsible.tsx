'use client';

import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '../lib/utils';

function Collapsible({ className, ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" className={cn('group/collapsible', className)} {...props} />;
}

function CollapsibleTrigger({ className, ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn('flex w-full cursor-pointer items-center py-1 text-sm font-medium transition-all', className)}
      {...props}
    />
  );
}

function CollapsiblePanel({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-panel" {...props} />;
}

/** Animated chevron that rotates when the parent Collapsible is open. */
function CollapsibleChevron({ className, ...props }: React.ComponentProps<typeof ChevronDownIcon>) {
  return (
    <ChevronDownIcon className={cn('size-4 transition-transform duration-200 group-data-[open]/collapsible:rotate-180', className)} {...props} />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsiblePanel, CollapsibleChevron };
