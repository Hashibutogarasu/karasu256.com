import { Suspense } from "react";
import { SignOutClient } from "./client";

/** Sign-out page. Clears Firebase Auth state then redirects to `?next`. */
export default function SignOutPage() {
  return (
    <Suspense>
      <SignOutClient />
    </Suspense>
  );
}
