"use client"

import { useState } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { CopyIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "../components/button";

interface CopyableToastContentProps {
  id: string | number;
  message: string;
  description?: string;
}

function CopyableToastContent({ id, message, description }: CopyableToastContentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(description ? `${message}\n${description}` : message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full pt-1 pb-7 pr-7">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => sonnerToast.dismiss(id)}
      >
        <XIcon className="size-3" />
      </Button>
      <p className="text-sm font-semibold leading-snug">{message}</p>
      {description && (
        <p className="text-sm opacity-70 mt-1">{description}</p>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-0 right-0 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        {copied
          ? <CheckIcon className="size-3" />
          : <CopyIcon className="size-3" />
        }
      </Button>
    </div>
  );
}

function toCustom(message: string, options?: ExternalToast): string | number {
  const description = typeof options?.description === "string" ? options.description : undefined;
  return sonnerToast.custom(
    (id) => <CopyableToastContent id={id} message={message} description={description} />,
    options,
  );
}

/**
 * Toast utility that renders toasts with a copy icon button at the bottom-right.
 * Use this instead of importing `toast` from `sonner` directly.
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
