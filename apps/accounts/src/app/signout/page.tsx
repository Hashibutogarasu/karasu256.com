import { Suspense } from "react";
import { SignOutClient } from "./client";

/** Sign-out page. Clears Firebase Auth state then redirects to `?next`. */
export default function SignOutPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <SignOutClient />
      </Suspense>
    </main>
  );
}
