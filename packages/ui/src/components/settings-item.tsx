import * as React from "react";

import { cn } from "../lib/utils";

/**
 * Bordered card row used for individual items in settings lists.
 * Provides consistent border, radius, and padding — content components
 * only need to handle their own layout and data.
 */
function SettingsItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="settings-item"
      className={cn("rounded-lg border border-border px-4 py-3", className)}
      {...props}
    />
  );
}

export { SettingsItem };
