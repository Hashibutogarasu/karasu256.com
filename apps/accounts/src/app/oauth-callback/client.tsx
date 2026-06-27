"use client"

import { useEffect } from "react"
import { signInWithCustomToken } from "firebase/auth"
import { useRouter } from "next/navigation"
import { signIn as nextAuthSignIn } from "next-auth/react"
import { Skeleton } from "@Hashibutogarasu/ui"
import { Container, CardContent, CardHeader } from "@Hashibutogarasu/ui"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { createSession } from "@/lib/api/auth-session"

/**
 * Retrieves the Firebase custom token issued by the OAuth signIn callback,
 * completes Firebase authentication, and establishes both the session cookie
 * and the NextAuth JWT before redirecting to the settings page.
 */
export function OAuthCallbackClient() {
  const router = useRouter()

  useEffect(() => {
    async function completeSignIn() {
      const res = await fetch("/api/auth/oauth-token")
      if (!res.ok) {
        router.replace("/")
        return
      }

      const { customToken } = (await res.json()) as { customToken: string }
      const credential = await signInWithCustomToken(getFirebaseAuth(), customToken)
      const idToken = await credential.user.getIdToken()
      await createSession(idToken)
      await nextAuthSignIn("credentials", { idToken, redirect: false })
      router.replace("/settings")
    }

    completeSignIn().catch(() => router.replace("/"))
  }, [router])

  return (
    <Container className="max-w-sm">
      <CardHeader>
        <Skeleton className="h-6 w-44" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Container>
  )
}
