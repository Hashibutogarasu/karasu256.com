import type { OAuthProvider, ProviderProfile, TokenSet } from "./base";

const AUTH_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";
const USER_EMAILS_URL = "https://api.github.com/user/emails";

interface GitHubTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
}

interface GitHubUser {
  id: number;
  name?: string | null;
  login: string;
  avatar_url?: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * GitHub OAuth 2.0 provider.
 * Fetches the primary verified email separately as the user endpoint may omit it
 * when the user has set their email to private.
 */
export class GitHubProvider implements OAuthProvider {
  readonly id = "github";
  readonly name = "GitHub";
  readonly defaultScopes = ["read:user", "user:email"];

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set");
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  buildAuthorizationUrl({
    redirectUri,
    state,
  }: {
    redirectUri: string;
    state: string;
    codeChallenge?: string;
  }): URL {
    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", this.defaultScopes.join(" "));
    url.searchParams.set("state", state);
    return url;
  }

  async exchangeCode({
    code,
    redirectUri,
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

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);

    const data = (await res.json()) as GitHubTokenResponse;
    if (data.error) throw new Error(`GitHub token exchange error: ${data.error}`);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      scope: data.scope ?? null,
      tokenType: data.token_type ?? null,
    };
  }

  async getProfile(accessToken: string): Promise<ProviderProfile> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const [userRes, emailsRes] = await Promise.all([
      fetch(USER_URL, { headers }),
      fetch(USER_EMAILS_URL, { headers }),
    ]);

    if (!userRes.ok) throw new Error(`GitHub user fetch failed: ${userRes.status}`);

    const user = (await userRes.json()) as GitHubUser;

    let email: string | null = null;
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as GitHubEmail[];
      email = emails.find((e) => e.primary && e.verified)?.email ?? null;
    }

    return {
      id: String(user.id),
      name: user.name ?? user.login,
      email,
      avatarUrl: user.avatar_url ?? null,
    };
  }
}
