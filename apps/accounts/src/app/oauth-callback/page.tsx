import { OAuthCallbackClient } from "./client"

/** Intermediate page shown during the OAuth sign-in redirect flow. */
export default function OAuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <OAuthCallbackClient />
    </main>
  )
}
