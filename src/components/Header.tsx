import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

/**
 * Site-wide header. Reads the Firebase session cookie to show an "Account"
 * link when authenticated, or "Sign In" when not. All auth actions are
 * delegated to accounts.karasu256.com — no auth pages live on this app.
 */
const Header = async () => {
  const user = await getSessionUser();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="flex h-12 items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors">
          Karasu Lab
        </Link>
        <nav>
          <ul className="flex items-center gap-4">
            {user ? (
              <li>
                <Link
                  href={`${accountsUrl}/dashboard`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Account
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href={accountsUrl ?? "#"}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
