import { cookies } from "next/headers"
import { and, eq, sql } from "drizzle-orm"
import type { Account, Profile } from "next-auth"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getDb } from "@Hashibutogarasu/db"
import { users, providerAccounts, providerTokens } from "@Hashibutogarasu/db/schema"
import { encryptToken } from "@/lib/crypto"

function extractAvatarUrl(providerId: string, profile: Profile): string | null {
  if (providerId === "google") {
    return (profile as { picture?: string }).picture ?? null
  }
  return (profile as { avatar_url?: string }).avatar_url ?? null
}

async function upsertProviderTokens(
  providerAccountId: string,
  account: Account,
): Promise<void> {
  if (!account.access_token) return

  const db = getDb()
  const encryptedAccess = await encryptToken(account.access_token)
  const encryptedRefresh = account.refresh_token
    ? await encryptToken(account.refresh_token)
    : null

  await db
    .insert(providerTokens)
    .values({
      providerAccountId,
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
}

/**
 * Handles initial OAuth sign-in for unauthenticated users.
 *
 * Finds or creates a Firebase Auth user, upserts the `users` and
 * `provider_accounts` rows, stores a short-lived Firebase custom token in an
 * httpOnly cookie, and returns the redirect URL for the OAuth callback page.
 */
export async function handleOAuthSignIn(account: Account, profile: Profile): Promise<string> {
  const db = getDb()
  const adminAuth = getAdminAuth()

  const providerId = account.provider
  const providerUserId = account.providerAccountId
  const email = typeof profile.email === "string" ? profile.email : null
  const name = typeof profile.name === "string" ? profile.name : null
  const avatarUrl = extractAvatarUrl(providerId, profile)

  const [existingAccount] = await db
    .select({ userId: providerAccounts.userId })
    .from(providerAccounts)
    .where(
      and(
        eq(providerAccounts.provider, providerId),
        eq(providerAccounts.providerUserId, providerUserId),
      ),
    )

  let uid: string
  if (existingAccount) {
    uid = existingAccount.userId
  } else if (email) {
    try {
      uid = (await adminAuth.getUserByEmail(email)).uid
    } catch {
      uid = (
        await adminAuth.createUser({
          email,
          displayName: name ?? undefined,
          photoURL: avatarUrl ?? undefined,
        })
      ).uid
    }
  } else {
    uid = (
      await adminAuth.createUser({
        displayName: name ?? undefined,
        photoURL: avatarUrl ?? undefined,
      })
    ).uid
  }

  await db
    .insert(users)
    .values({ id: uid, name })
    .onConflictDoUpdate({ target: users.id, set: { updatedAt: sql`now()` } })

  const [accountRow] = await db
    .insert(providerAccounts)
    .values({ userId: uid, provider: providerId, providerUserId, email, name, avatarUrl })
    .onConflictDoUpdate({
      target: [providerAccounts.provider, providerAccounts.providerUserId],
      set: { email, name, avatarUrl, updatedAt: new Date() },
    })
    .returning({ id: providerAccounts.id })

  await upsertProviderTokens(accountRow.id, account)

  const customToken = await adminAuth.createCustomToken(uid)
  const cookieStore = await cookies()
  cookieStore.set("oauth_custom_token", customToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  })

  return "/oauth-callback"
}

/**
 * Handles OAuth account linking for already-authenticated users.
 *
 * Verifies the provider account is not already owned by a different user,
 * upserts `provider_accounts` and `provider_tokens`, and returns the redirect
 * URL for the settings linking page.
 */
export async function handleOAuthLinking(
  account: Account,
  profile: Profile,
  userId: string,
): Promise<string> {
  const db = getDb()

  const providerId = account.provider
  const providerUserId = account.providerAccountId
  const email = typeof profile.email === "string" ? profile.email : null
  const name = typeof profile.name === "string" ? profile.name : null
  const avatarUrl = extractAvatarUrl(providerId, profile)

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
    return "/settings/linking?error=provider_already_linked"
  }

  if (!account.access_token) {
    return "/settings/linking?error=missing_token"
  }

  const [accountRow] = await db
    .insert(providerAccounts)
    .values({ userId, provider: providerId, providerUserId, email, name, avatarUrl })
    .onConflictDoUpdate({
      target: [providerAccounts.provider, providerAccounts.providerUserId],
      set: { email, name, avatarUrl, updatedAt: new Date() },
    })
    .returning({ id: providerAccounts.id })

  await upsertProviderTokens(accountRow.id, account)

  return `/settings/linking?linked=${encodeURIComponent(providerId)}`
}
