import { cn } from '../lib/utils';

export interface ProgressBarProps {
  /** Progress fraction, clamped to 0–1. */
  value: number;
  className?: string;
}

/** A thin, rounded progress bar that fills from the left as `value` increases. */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-1 overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${clamped})` }}
      />
    </div>
  );
}
