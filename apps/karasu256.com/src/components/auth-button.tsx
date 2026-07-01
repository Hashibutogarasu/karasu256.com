"use client";

import { useTranslation } from "react-i18next";
import { Menu } from "@base-ui/react/menu";
import { Identicon, Button } from "@Hashibutogarasu/ui";
import { signOutAction } from "@/app/actions/auth";

interface AuthButtonProps {
  accountsUrl: string;
  uid: string | null;
  displayName: string | null;
  email: string | null;
}

/**
 * Renders a sign-in button when unauthenticated, or an account dropdown menu
 * when authenticated. The dropdown shows an identicon, display name, email address,
 * a link to account settings, and a sign-out button.
 */
export function AuthButton({ accountsUrl, uid, displayName, email }: AuthButtonProps) {
  const { t } = useTranslation();

  if (!uid) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => { window.location.href = accountsUrl; }}
      >
        {t("header.signIn")}
      </Button>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className="block p-0 bg-transparent border-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t("header.accountMenuLabel")}
      >
        <Identicon value={uid} size={36} className="border border-border [&>svg]:block" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="z-50 min-w-48 rounded-md border border-border bg-card text-card-foreground shadow-md outline-none">
            <div className="flex flex-col items-start gap-2 px-3 py-4">
              <Identicon value={uid} size={40} className="border border-border [&>svg]:block" />
              {displayName && (
                <span className="text-sm font-medium">{displayName}</span>
              )}
              <span className="text-sm text-muted-foreground break-all">
                {email ?? uid}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="p-1">
              <Menu.Item
                render={<a href="/settings" />}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                {t("header.settings")}
              </Menu.Item>
              <form action={signOutAction}>
                <Menu.Item
                  nativeButton={true}
                  render={<button type="submit" className="w-full" />}
                  className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {t("header.signOut")}
                </Menu.Item>
              </form>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
