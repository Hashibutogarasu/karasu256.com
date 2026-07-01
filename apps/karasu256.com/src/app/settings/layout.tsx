import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase-session";
import { SettingsShell } from "@/components/settings-shell";

/**
 * Settings layout. Redirects unauthenticated users to the accounts portal,
 * then renders the shared sidebar shell around the page content.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionUser();
  if (!token) {
    redirect(process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "/");
  }
  const user = {
    uid: token.uid,
    displayName: token.name ?? null,
    email: token.email ?? null,
    photoURL: token.picture ?? null,
  };
  return <SettingsShell user={user}>{children}</SettingsShell>;
}
