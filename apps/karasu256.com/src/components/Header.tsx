import Link from "next/link";
import { getSessionUser } from "@/lib/firebase-session";
import { getUser } from "@/lib/db/ensure-user";
import { AuthButton } from "@/components/auth-button";

/**
 * Site-wide header. Reads the NextAuth session (backed by Firebase) to show
 * an account menu when authenticated, or a sign-in button when not.
 */
const Header = async () => {
  const sessionUser = await getSessionUser();
  const dbUser = sessionUser ? await getUser(sessionUser.uid) : null;
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "#";

  return (
    <header className="sticky top-0 z-20 bg-background w-full h-12 px-6 flex justify-between items-center border-b border-border shrink-0">
      <div className="font-bold text-xl">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Karasu Lab
        </Link>
      </div>
      <nav>
        <ul className="flex gap-6">
          <li>
            <AuthButton
              accountsUrl={accountsUrl}
              uid={sessionUser?.uid ?? null}
              displayName={sessionUser?.name ?? null}
              email={sessionUser?.email ?? null}
              iconUrl={dbUser?.iconUrl ?? null}
            />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
