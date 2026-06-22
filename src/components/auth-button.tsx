"use client";

import { Button, Identicon } from "@karasu/ui";

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
      <button
        type="button"
        className="block p-0 bg-transparent border-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={() => { window.location.href = `${accountsUrl}/settings`; }}
        aria-label={accountLabel}
      >
        <Identicon value={uid} size={36} className="border border-border [&>svg]:block" />
      </button>
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
