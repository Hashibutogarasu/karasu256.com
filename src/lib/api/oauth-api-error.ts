/** Standard OAuth error codes surfaced by API route handlers. */
export type OAuthErrorCode =
  | "invalid_grant"
  | "insufficient_scope"
  | "token_verification_failed"
  | "access_denied";

/**
 * Thrown by OAuth route handlers to signal a known error condition.
 * Caught at the route boundary to produce a structured step failure response.
 */
export class OAuthApiError extends Error {
  constructor(public readonly code: OAuthErrorCode) {
    super(code);
    this.name = "OAuthApiError";
  }
}
