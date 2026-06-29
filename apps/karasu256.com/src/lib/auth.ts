import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getAdminAuth } from "@/lib/firebase-admin"
import { makeFirebaseAuthorize, makeNextAuthCookies } from "@Hashibutogarasu/utils/server"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { idToken: {} },
      authorize: (credentials) => makeFirebaseAuthorize(getAdminAuth())(credentials),
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
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
