import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { cookies } from "next/headers"
import { getAdminAuth } from "@/lib/firebase-admin"
import { makeFirebaseAuthorize, makeNextAuthCookies } from "@Hashibutogarasu/utils/server"
import { handleOAuthSignIn, handleOAuthLinking } from "@/lib/auth/oauth"
import { SESSION_COOKIE_NAME } from "@/lib/session"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { idToken: {} },
      authorize: makeFirebaseAuthorize(getAdminAuth()),
    }),
    Google,
    GitHub,
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.type !== "oauth" || !profile) return true

      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

      if (!sessionCookie) {
        return handleOAuthSignIn(account, profile)
      }

      try {
        const { uid } = await getAdminAuth().verifySessionCookie(sessionCookie, true)
        return handleOAuthLinking(account, profile, uid)
      } catch {
        return false
      }
    },
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (typeof token.uid === "string") {
        session.user.id = token.uid
      }
      return session
    },
  },
  cookies: makeNextAuthCookies(process.env.BASE_DOMAIN),
})
