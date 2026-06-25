import type { OAuthProvider, ProviderProfile, TokenSet } from "./base";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface GoogleUserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

/**
 * Google OAuth 2.0 provider.
 * Uses the OpenID Connect userinfo endpoint for profile data.
 * Supports PKCE (S256) and offline access for refresh tokens.
 */
export class GoogleProvider implements OAuthProvider {
  readonly id = "google";
  readonly name = "Google";
  readonly defaultScopes = ["openid", "email", "profile"];

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  buildAuthorizationUrl({
    redirectUri,
    state,
    codeChallenge,
  }: {
    redirectUri: string;
    state: string;
    codeChallenge?: string;
  }): URL {
    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.defaultScopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    if (codeChallenge) {
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
    }
    return url;
  }

  async exchangeCode({
    code,
    redirectUri,
    codeVerifier,
  }: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<TokenSet> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    if (codeVerifier) body.set("code_verifier", codeVerifier);

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);

    const data = (await res.json()) as GoogleTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      scope: data.scope ?? null,
      tokenType: data.token_type ?? null,
    };
  }

  async getProfile(accessToken: string): Promise<ProviderProfile> {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Google userinfo fetch failed: ${res.status}`);

    const data = (await res.json()) as GoogleUserInfo;
    return {
      id: data.sub,
      name: data.name ?? null,
      email: data.email ?? null,
      avatarUrl: data.picture ?? null,
    };
  }
}
