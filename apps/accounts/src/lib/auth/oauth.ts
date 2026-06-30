import { cookies } from "next/headers"
import { and, eq } from "drizzle-orm"
import type { Account, Profile } from "next-auth"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getDb } from "@Hashibutogarasu/db"
import { providerAccounts, providerTokens } from "@Hashibutogarasu/db/schema"
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
 * Requires the provider account to already be linked in `provider_accounts`.
 * If no matching row is found the sign-in is rejected and the user is
 * redirected to the error page. On success a short-lived Firebase custom token
 * is stored in an httpOnly cookie and the user is redirected to /oauth-callback.
 */
export async function handleOAuthSignIn(account: Account, profile: Profile): Promise<string> {
  const db = getDb()

  const providerId = account.provider
  const providerUserId = account.providerAccountId

  const [existingAccount] = await db
    .select({ id: providerAccounts.id, userId: providerAccounts.userId })
    .from(providerAccounts)
    .where(
      and(
        eq(providerAccounts.provider, providerId),
        eq(providerAccounts.providerUserId, providerUserId),
      ),
    )

  if (!existingAccount) {
    return "/oauth-error?reason=account_not_linked"
  }

  await upsertProviderTokens(existingAccount.id, account)

  const customToken = await getAdminAuth().createCustomToken(existingAccount.userId)
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
 * If the OAuth identity is already registered to a different Firebase UID but
 * shares the same email as the current user, the record is migrated to the
 * current UID. This resolves cases where the same person ended up with two
 * Firebase UIDs (e.g. email/password then a direct OAuth sign-up).
 * If the email does not match, the link is rejected with `provider_already_linked`.
 *
 * On success, upserts `provider_accounts` and `provider_tokens` and returns
 * the redirect URL for the settings linking page.
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
    const canReclaim =
      !!email &&
      (await getAdminAuth()
        .getUser(userId)
        .then((u) => u.email === email)
        .catch(() => false))

    if (!canReclaim) {
      return "/settings/linking?error=provider_already_linked"
    }

    if (!account.access_token) {
      return "/settings/linking?error=missing_token"
    }

    await db
      .update(providerAccounts)
      .set({ userId, email, name, avatarUrl, updatedAt: new Date() })
      .where(eq(providerAccounts.id, existing.id))

    await upsertProviderTokens(existing.id, account)

    return `/settings/linking?linked=${encodeURIComponent(providerId)}`
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
