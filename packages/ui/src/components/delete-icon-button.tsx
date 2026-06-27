"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "./button";

interface DeleteIconButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "variant" | "children"> {
  /** When true, replaces the trash icon with an animated spinner and disables the button. */
  loading?: boolean;
}

/**
 * Ghost icon button that shows a trash icon at rest and a spinner while a
 * delete operation is in progress. Color is intentionally neutral (not red)
 * so it matches the surrounding UI without drawing extra attention.
 */
function DeleteIconButton({ loading, disabled, ...props }: DeleteIconButtonProps) {
  return (
    <Button variant="ghost" disabled={loading || disabled} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}

export { DeleteIconButton, type DeleteIconButtonProps };
