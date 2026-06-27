import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { cookies } from "next/headers"
import { and, eq } from "drizzle-orm"
import { getAdminAuth } from "@/lib/firebase-admin"
import { makeFirebaseAuthorize, makeNextAuthCookies } from "@Hashibutogarasu/utils/server"
import { getDb } from "@Hashibutogarasu/db"
import { providerAccounts, providerTokens } from "@Hashibutogarasu/db/schema"
import { encryptToken } from "@/lib/crypto"
import { SESSION_COOKIE_NAME } from "@/lib/session"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { idToken: {} },
      authorize: makeFirebaseAuthorize(getAdminAuth()),
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.type !== "oauth" || !profile) return true

      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
      if (!sessionCookie) return false

      let userId: string
      try {
        const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true)
        userId = decoded.uid
      } catch {
        return false
      }

      const providerId = account.provider
      const providerUserId = account.providerAccountId
      const avatarUrl =
        providerId === "google"
          ? ((profile as { picture?: string }).picture ?? null)
          : ((profile as { avatar_url?: string }).avatar_url ?? null)

      const db = getDb()

      const [existing] = await db
        .select({ id: providerAccounts.id, userId: providerAccounts.userId })
        .from(providerAccounts)
        .where(
          and(
            eq(providerAccounts.provider, providerId),
            eq(providerAccounts.providerUserId, providerUserId),
          ),
        )

      if (existing && existing.userId !== userId) {
        return `/settings/linking?error=provider_already_linked`
      }

      const [accountRow] = await db
        .insert(providerAccounts)
        .values({
          userId,
          provider: providerId,
          providerUserId,
          email: typeof profile.email === "string" ? profile.email : null,
          name: typeof profile.name === "string" ? profile.name : null,
          avatarUrl,
        })
        .onConflictDoUpdate({
          target: [providerAccounts.provider, providerAccounts.providerUserId],
          set: {
            email: typeof profile.email === "string" ? profile.email : null,
            name: typeof profile.name === "string" ? profile.name : null,
            avatarUrl,
            updatedAt: new Date(),
          },
        })
        .returning({ id: providerAccounts.id })

      if (!account.access_token) {
        return `/settings/linking?error=missing_token`
      }

      const encryptedAccess = await encryptToken(account.access_token)
      const encryptedRefresh = account.refresh_token
        ? await encryptToken(account.refresh_token)
        : null

      await db
        .insert(providerTokens)
        .values({
          providerAccountId: accountRow.id,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
          scope: account.scope ?? null,
          tokenType: account.token_type ?? null,
        })
        .onConflictDoUpdate({
          target: [providerTokens.providerAccountId],
          set: {
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope ?? null,
            tokenType: account.token_type ?? null,
            updatedAt: new Date(),
          },
        })

      return `/settings/linking?linked=${encodeURIComponent(providerId)}`
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
