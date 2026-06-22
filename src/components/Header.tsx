import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { AuthButton } from "@/components/auth-button";

/**
 * Site-wide header. Reads the Firebase session cookie to show an identicon
 * button when authenticated, or a sign-in button when not. All auth actions
 * are delegated to accounts.karasu256.com — no auth pages live on this app.
 */
const Header = async () => {
  const user = await getSessionUser();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "#";

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
            <AuthButton accountsUrl={accountsUrl} uid={user?.uid ?? null} />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
