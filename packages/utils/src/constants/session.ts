/** Name of the Firebase session cookie shared across (sub)domains. */
export const SESSION_COOKIE_NAME = 'session';

/**
 * Name of the better-auth session cookie shared across (sub)domains. Fixed
 * explicitly (see `advanced.cookies.session_token.name` in
 * `apps/accounts.karasu256.com/src/lib/auth/auth-options.ts`) rather than
 * relying on better-auth's versioned default, so every app that only holds
 * this cookie's raw value (not a better-auth instance of its own) can name
 * it without depending on better-auth internals.
 */
export const BETTER_AUTH_SESSION_COOKIE_NAME = 'better_auth_session';
