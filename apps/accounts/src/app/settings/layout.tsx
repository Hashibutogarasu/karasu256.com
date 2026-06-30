import { SettingsShell } from "./shell";

/**
 * Reads NEXT_PUBLIC_APP_URL at request time on the server and passes it to
 * the client shell as a prop, preventing the value from being undefined when
 * the variable is absent from the client-side build bundle.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "/";
  return <SettingsShell appUrl={appUrl}>{children}</SettingsShell>;
}
