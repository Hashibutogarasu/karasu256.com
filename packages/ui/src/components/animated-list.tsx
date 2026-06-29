import * as React from "react"

import { cn } from "../lib/utils"

/**
 * Wrapper `<ul>` for a list whose items use {@link AnimatedListItem}.
 */
function AnimatedList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="animated-list"
      className={cn(className)}
      {...props}
    />
  )
}

interface AnimatedListItemProps extends React.ComponentProps<"li"> {
  children?: React.ReactNode;
  /** When true, plays the exit animation then calls {@link onRemoved}. */
  removing?: boolean;
  /** Called after the exit animation finishes. Remove the item from state here. */
  onRemoved?: () => void;
}

/**
 * List item that animates in on mount and out when `removing` becomes true.
 *
 * Set `removing` to trigger the exit animation, then remove the item from
 * the parent list inside `onRemoved` — which fires when the animation ends.
 */
function AnimatedListItem({ removing, onRemoved, className, ...props }: AnimatedListItemProps) {
  return (
    <li
      data-slot="animated-list-item"
      data-removing={removing ? "" : undefined}
      onAnimationEnd={removing ? onRemoved : undefined}
      className={cn(className)}
      {...props}
    />
  )
}

export { AnimatedList, AnimatedListItem }
