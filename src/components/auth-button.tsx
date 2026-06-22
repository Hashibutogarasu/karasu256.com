"use client";

import { Button, Identicon } from "@karasu/ui";

interface AuthButtonProps {
  accountsUrl: string;
  uid: string | null;
}

/**
 * Renders a sign-in button or an identicon button linking to account settings.
 * Client component required for onClick navigation to the accounts subdomain.
 */
export function AuthButton({ accountsUrl, uid }: AuthButtonProps) {
  if (uid) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => { window.location.href = `${accountsUrl}/settings`; }}
        aria-label="Account settings"
      >
        <Identicon value={uid} size={24} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => { window.location.href = accountsUrl; }}
    >
      Sign In
    </Button>
  );
}
