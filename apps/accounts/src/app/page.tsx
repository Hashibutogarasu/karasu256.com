import type { Metadata } from "next";
import { SignInCard } from "@/components/auth/sign-in-card";

export const metadata: Metadata = {
  title: "Sign In — Karasu Lab",
};

/** Sign-in page for unauthenticated users. */
export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <SignInCard />
    </main>
  );
}
