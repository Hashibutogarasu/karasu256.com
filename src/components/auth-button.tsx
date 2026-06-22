"use client";

import { Button, Identicon } from "@Hashibutogarasu/ui";

interface AuthButtonProps {
  accountsUrl: string;
  uid: string | null;
  /** Label shown on the sign-in button when not authenticated. */
  signInLabel: string;
  /** Accessible label for the account settings button when authenticated. */
  accountLabel: string;
}

/**
 * Renders a sign-in button or an identicon button linking to account settings.
 * Client component required for onClick navigation to the accounts subdomain.
 */
export function AuthButton({ accountsUrl, uid, signInLabel, accountLabel }: AuthButtonProps) {
  if (uid) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full overflow-hidden p-0"
        onClick={() => { window.location.href = `${accountsUrl}/settings`; }}
        aria-label={accountLabel}
      >
        <Identicon value={uid} size={32} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => { window.location.href = accountsUrl; }}
    >
      {signInLabel}
    </Button>
  );
}
