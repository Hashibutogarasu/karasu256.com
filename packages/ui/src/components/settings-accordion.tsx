'use client';

import * as React from 'react';
import { useState } from 'react';

import { AnimatedPanel } from './animated-panel';
import { CardContent } from './card';
import { Collapsible, CollapsibleChevron } from './collapsible';
import { Container } from './container';

interface SettingsAccordionProps {
  /** Displayed in the header as the section title. */
  title: React.ReactNode;
  /**
   * Optional element rendered to the left of the chevron.
   * Click events on this element do not propagate to the collapse toggle.
   */
  action?: React.ReactNode;
  /** Initial open state for uncontrolled usage. Defaults to `true`. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Callback fired when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Card-backed collapsible section for settings pages.
 *
 * Matches the passkey accordion style in the accounts portal:
 * - `Container` + `CardContent` background
 * - Uppercase muted title
 * - Optional action slot (click does not toggle collapse)
 * - Animated height transition via `AnimatedPanel`
 */
function SettingsAccordion({ title, action, defaultOpen = true, open: controlledOpen, onOpenChange, children }: SettingsAccordionProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen! : internalOpen;

  function toggle() {
    const next = !open;
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  function handleOpenChange(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  return (
    <Container>
      <CardContent className="py-4">
        <Collapsible open={open} onOpenChange={handleOpenChange}>
          <div className="flex cursor-pointer items-center gap-1 py-1" onClick={toggle}>
            <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
            {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
            <CollapsibleChevron />
          </div>
          <AnimatedPanel open={open}>{children}</AnimatedPanel>
        </Collapsible>
      </CardContent>
    </Container>
  );
}

export { SettingsAccordion, type SettingsAccordionProps };
