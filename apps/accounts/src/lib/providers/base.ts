/** Normalized profile returned by any OAuth provider. */
export interface ProviderProfile {
  /** The user's unique ID within the provider. */
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/** Token set returned by the provider's token endpoint. */
export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scope: string | null;
  tokenType: string | null;
}

/**
 * Contract every OAuth 2.0 provider implementation must satisfy.
 * Routes use this interface exclusively — they have no knowledge of
 * provider-specific endpoints or request shapes.
 */
export interface OAuthProvider {
  /** Lowercase identifier stored in the database, e.g. "google". */
  readonly id: string;
  /** Human-readable label shown in the UI. */
  readonly name: string;
  /** OAuth 2.0 scopes requested by default. */
  readonly defaultScopes: string[];

  /**
   * Builds the authorization URL to which the user is redirected.
   * @param redirectUri - The callback URI registered with the provider.
   * @param state - CSRF protection value to round-trip through the provider.
   * @param codeChallenge - PKCE S256 code challenge (omit if provider does not support PKCE).
   */
  buildAuthorizationUrl(params: {
    redirectUri: string;
    state: string;
    codeChallenge?: string;
  }): URL;

  /**
   * Exchanges an authorization code for a token set.
   * @param codeVerifier - PKCE verifier (omit if not used for this provider).
   */
  exchangeCode(params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<TokenSet>;

  /** Fetches the authenticated user's profile using the access token. */
  getProfile(accessToken: string): Promise<ProviderProfile>;
}
