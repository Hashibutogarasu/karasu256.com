import { toSvg } from "jdenticon";
import { cn } from "../lib/utils";

interface IdenticonProps {
  /** The string used to generate the identicon (typically a Firebase UID). */
  value: string;
  /** Width and height in pixels. @default 64 */
  size?: number;
  className?: string;
}

/**
 * Renders a deterministic identicon SVG derived from {@link IdenticonProps.value}.
 *
 * Uses jdenticon to generate a unique visual hash. Safe to render server-side.
 */
export function Identicon({ value, size = 64, className }: IdenticonProps) {
  const svg = toSvg(value, size);
  return (
    <div
      className={cn("rounded-full overflow-hidden shrink-0", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
