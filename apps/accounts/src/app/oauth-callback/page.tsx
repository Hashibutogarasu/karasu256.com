import { OAuthCallbackClient } from "./client"

/** Landing page after a social OAuth sign-in redirect. */
export default function OAuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <OAuthCallbackClient />
    </main>
  )
}
