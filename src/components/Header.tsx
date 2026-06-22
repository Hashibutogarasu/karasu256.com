import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { buttonVariants } from "@karasu/ui";

/**
 * Site-wide header. Reads the Firebase session cookie to show an "Account"
 * link when authenticated, or "Sign In" when not. All auth actions are
 * delegated to accounts.karasu256.com — no auth pages live on this app.
 */
const Header = async () => {
  const user = await getSessionUser();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;

  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b border-gray-200">
      <div className="font-bold text-xl">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Karasu Lab
        </Link>
      </div>
      <nav>
        <ul className="flex gap-6">
          <li>
            {user ? (
              <Link href={`${accountsUrl}/settings`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Account
              </Link>
            ) : (
              <Link href={accountsUrl ?? "#"} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
