'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import './animated-height.css';

/**
 * Wraps its children in a container that smoothly animates its height
 * whenever the content size changes, using ResizeObserver.
 *
 * Place this inside a card or panel whose height should transition when
 * inner content grows or shrinks.
 */
export function AnimatedHeight({ className, children, ...props }: React.ComponentProps<'div'>) {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('animated-height', className)} style={{ height }} {...props}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
