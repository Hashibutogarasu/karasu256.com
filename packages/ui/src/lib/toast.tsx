"use client"

import { useEffect, useState } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { CopyIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "../components/button";

interface ToastProgressBarProps {
  id: string | number;
  duration: number;
}

/**
 * Green progress bar that shrinks from right to left over `duration` ms,
 * then dismisses the toast.
 */
function ToastProgressBar({ id, duration }: ToastProgressBarProps) {
  useEffect(() => {
    const timer = setTimeout(() => sonnerToast.dismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b">
      <div
        className="h-full w-full bg-green-500"
        style={{
          transformOrigin: "left center",
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

interface CopyableToastContentProps {
  id: string | number;
  message: string;
  description?: string;
  /** When set, shows a progress bar and dismisses after this many milliseconds. */
  duration?: number;
}

function CopyableToastContent({ id, message, description, duration }: CopyableToastContentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(description ? `${message}\n${description}` : message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-16 overflow-hidden bg-[var(--normal-bg)] text-[var(--normal-text)] border border-[var(--normal-border)] rounded-[var(--border-radius)] shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => sonnerToast.dismiss(id)}
      >
        <XIcon className="size-3" />
      </Button>
      <div className="flex flex-col justify-center h-full pl-3 pr-9">
        <p className="text-sm font-semibold leading-snug truncate">{message}</p>
        {description && (
          <p className="text-sm opacity-70 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        {copied
          ? <CheckIcon className="size-3" />
          : <CopyIcon className="size-3" />
        }
      </Button>
      {duration !== undefined && <ToastProgressBar id={id} duration={duration} />}
    </div>
  );
}

/**
 * Renders a custom toast. Sonner's own auto-dismiss is always disabled;
 * pass `duration` to enable a timed progress bar that closes the toast.
 */
function toCustom(message: string, options?: ExternalToast): string | number {
  const { duration, description: desc, ...rest } = options ?? {};
  const description = typeof desc === "string" ? desc : undefined;
  return sonnerToast.custom(
    (id) => (
      <CopyableToastContent
        id={id}
        message={message}
        description={description}
        duration={duration}
      />
    ),
    { ...rest, duration: Infinity },
  );
}

/**
 * Toast utility that renders toasts with a copy icon button at the bottom-right.
 * Use this instead of importing `toast` from `sonner` directly.
 *
 * Pass `duration` (ms) to show a green progress bar and auto-close.
 * Omit `duration` to keep the toast open until the user dismisses it.
 */
export const toast = {
  success: (message: string, options?: ExternalToast) => toCustom(message, options),
  error: (message: string, options?: ExternalToast) => toCustom(message, options),
  warning: (message: string, options?: ExternalToast) => toCustom(message, options),
  info: (message: string, options?: ExternalToast) => toCustom(message, options),
  loading: (message: string, options?: ExternalToast) => toCustom(message, options),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: sonnerToast.promise.bind(sonnerToast),
};
