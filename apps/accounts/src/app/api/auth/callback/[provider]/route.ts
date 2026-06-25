import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { providerAccounts, providerTokens } from "@Hashibutogarasu/db/schema";
import { encryptToken } from "@/lib/crypto";
import { getProvider } from "@/lib/providers";
import { clearStateCookie, readStateCookie } from "@/lib/providers/oauth-state";

/**
 * Handles the OAuth callback from a third-party provider.
 *
 * Flow:
 * 1. Verify the state parameter against the encrypted state cookie.
 * 2. Exchange the authorization code for a token set via the provider interface.
 * 3. Fetch the user's profile via the provider interface.
 * 4. Upsert the provider_accounts row linked to the authenticated user.
 * 5. Encrypt and upsert the provider_tokens row.
 * 6. Redirect to the account linking settings page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/settings/linking?error=${encodeURIComponent(errorParam)}`, request.nextUrl.origin),
      { headers: { "Set-Cookie": clearStateCookie() } },
    );
  }

  if (!code || !stateParam) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie");
  const stateCookie = await readStateCookie(cookieHeader);

  if (!stateCookie || stateCookie.state !== stateParam) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const { userId, codeVerifier } = stateCookie;
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/${providerId}`;

  let tokenSet;
  let profile;
  try {
    tokenSet = await provider.exchangeCode({ code, redirectUri, codeVerifier: codeVerifier ?? undefined });
    profile = await provider.getProfile(tokenSet.accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider error";
    return NextResponse.redirect(
      new URL(`/settings/linking?error=${encodeURIComponent(message)}`, request.nextUrl.origin),
      { headers: { "Set-Cookie": clearStateCookie() } },
    );
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: providerAccounts.id, userId: providerAccounts.userId })
    .from(providerAccounts)
    .where(
      and(
        eq(providerAccounts.provider, providerId),
        eq(providerAccounts.providerUserId, profile.id),
      ),
    );

  if (existing && existing.userId !== userId) {
    return NextResponse.redirect(
      new URL(`/settings/linking?error=provider_already_linked`, request.nextUrl.origin),
      { headers: { "Set-Cookie": clearStateCookie() } },
    );
  }

  const [account] = await db
    .insert(providerAccounts)
    .values({
      userId,
      provider: providerId,
      providerUserId: profile.id,
      email: profile.email ?? null,
      name: profile.name ?? null,
      avatarUrl: profile.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: [providerAccounts.provider, providerAccounts.providerUserId],
      set: {
        email: profile.email ?? null,
        name: profile.name ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: providerAccounts.id });

  const encryptedAccess = await encryptToken(tokenSet.accessToken);
  const encryptedRefresh = tokenSet.refreshToken
    ? await encryptToken(tokenSet.refreshToken)
    : null;

  await db
    .insert(providerTokens)
    .values({
      providerAccountId: account.id,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresAt: tokenSet.expiresAt,
      scope: tokenSet.scope,
      tokenType: tokenSet.tokenType,
    })
    .onConflictDoUpdate({
      target: [providerTokens.providerAccountId],
      set: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt: tokenSet.expiresAt,
        scope: tokenSet.scope,
        tokenType: tokenSet.tokenType,
        updatedAt: new Date(),
      },
    });

  return NextResponse.redirect(
    new URL(`/settings/linking?linked=${encodeURIComponent(providerId)}`, request.nextUrl.origin),
    { headers: { "Set-Cookie": clearStateCookie() } },
  );
}
