import * as React from 'react';

import { cn } from '../lib/utils';

interface MarkerStep {
  key: string;
  label: string;
  status: 'complete' | 'current' | 'error' | 'upcoming';
}

interface MarkerProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: MarkerStep[];
}

const DOT_CLASSES: Record<MarkerStep['status'], string> = {
  complete: 'bg-primary border-primary',
  current: 'bg-background border-primary ring-2 ring-primary/30',
  error: 'bg-destructive border-destructive',
  upcoming: 'bg-background border-border',
};

const LABEL_CLASSES: Record<MarkerStep['status'], string> = {
  complete: 'text-foreground',
  current: 'text-foreground font-medium',
  error: 'text-destructive font-medium',
  upcoming: 'text-muted-foreground',
};

function Marker({ steps, className, ...props }: MarkerProps) {
  return (
    <ol data-slot="marker" className={cn('flex items-start', className)} {...props}>
      {steps.map((step, i) => (
        <li key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span className={cn('size-3 rounded-full border-2', DOT_CLASSES[step.status])} />
            <span className={cn('text-xs whitespace-nowrap', LABEL_CLASSES[step.status])}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('mx-2 h-0.5 flex-1 self-start mt-1.5', step.status === 'complete' ? 'bg-primary' : 'bg-border')} />
          )}
        </li>
      ))}
    </ol>
  );
}

export { Marker, type MarkerStep, type MarkerProps };
