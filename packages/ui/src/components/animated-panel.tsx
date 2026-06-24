import * as React from "react"

import { cn } from "../lib/utils"

interface AnimatedPanelProps extends React.ComponentProps<"div"> {
  /** Controls whether the panel is expanded. */
  open: boolean;
}

/**
 * Height-animating panel using the CSS grid trick.
 *
 * Animates between `grid-template-rows: 0fr` (collapsed) and `1fr` (expanded)
 * without requiring knowledge of the content height. The inner wrapper clips
 * overflow so content is hidden while the row collapses.
 */
function AnimatedPanel({ open, className, children, ...props }: AnimatedPanelProps) {
  return (
    <div
      data-slot="animated-panel"
      data-open={open ? "" : undefined}
      className={cn(className)}
      {...props}
    >
      <div data-slot="animated-panel-inner">{children}</div>
    </div>
  )
}

export { AnimatedPanel }
