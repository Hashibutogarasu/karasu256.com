import { Suspense } from "react"
import type { Metadata } from "next"
import { OAuthErrorClient } from "./client"

export const metadata: Metadata = {
  title: "Sign-in failed — Karasu Lab",
}

/** Shown when the OAuth sign-in flow fails to authenticate the user. */
export default function OAuthErrorPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <OAuthErrorClient />
      </Suspense>
    </main>
  )
}
