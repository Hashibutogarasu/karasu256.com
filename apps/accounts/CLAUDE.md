# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start the dev server (http://localhost:3000)
pnpm build      # Production build
pnpm lint       # Run ESLint
```

There are no automated tests. Verify features manually with `pnpm dev`.

Add shadcn components with `pnpm dlx shadcn@latest add <component>`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in all values before running locally. The middleware validates Firebase config on every request and returns HTTP 500 if any variable is missing.

`FIREBASE_ADMIN_PRIVATE_KEY` may contain literal `\n` sequences from hosting panels — `parseFirebaseAdminEnv()` normalizes them automatically.

## Architecture

This is a **Next.js 16 App Router** account portal for Karasu Lab. Its sole purpose is sign-in, sign-out, and passkey management.

### Authentication flow

1. The client authenticates with Firebase Auth (email/password, Google/GitHub OAuth, or passkey).
2. On `onAuthStateChanged`, the client POSTs the Firebase ID token to `POST /api/auth/session`.
3. The server exchanges the ID token for a Firebase **session cookie** (14-day lifetime) via the Admin SDK and sets it `httpOnly`. When `BASE_DOMAIN` is set, the cookie is scoped to `.{BASE_DOMAIN}` for cross-subdomain sharing.
4. Edge middleware (`src/middleware.ts`) reads the session cookie to gate `/dashboard` (requires cookie) and `/` (redirects away if cookie present). Full cookie verification (signature + expiry) happens inside individual API routes and server components — the Admin SDK is not Edge-compatible.

### Social login & OAuth authorization server (better-auth)

This app hosts the monorepo's single **better-auth** instance (`src/lib/auth/server.ts`, mounted at `/api/auth/[...all]`), scoped to exactly two jobs — Firebase remains the source of truth for the site's own login/session:

1. **Social sign-in/linking** — the Google/GitHub OAuth handshake. `socialProviders.*.disableImplicitSignUp: true` blocks brand-new signups via social login; only an already-linked account can sign in this way, and `databaseHooks.session.create.after` (`bridgeFirebaseSessionForSocialSignIn` in `src/lib/auth/hooks.ts`) mints a Firebase custom token so the browser still ends up with a real Firebase session via the existing `/auth/callback` handoff.
2. **OAuth 2.1 / OIDC authorization server** (`@better-auth/oauth-provider`) for third-party apps — `/oauth2/authorize`, `/oauth2/token`, `/oauth2/consent` (UI at `src/app/oauth/consent/`), etc. Client management UI lives on karasu256.com's `/settings/developer`, calling this app's endpoints via `authClient.oauth2.*`.

   `@better-auth/oauth-provider` only issues a **JWT** access token (locally verifiable, no DB read — see karasu256.com's `route-auth.ts`) when the token request includes a `resource` parameter (RFC 8707) matching `validAudiences` (defaults to this app's own internal `baseURL`). Without it, the token is opaque and karasu256.com's JWT-only verification rejects it with 401. Note `baseURL` internally includes the auth mount path — the `iss`/`aud`/JWKS identifier is `${BETTER_AUTH_URL}/api/auth`, not just `BETTER_AUTH_URL` — confirmed by decoding a real `/oauth2/authorize` redirect's `iss` query param. Every client calling `/oauth2/token` — including the "test client" dialog in developer settings — must send `resource=${BETTER_AUTH_URL}/api/auth`.

Since `oauthProvider` needs its own session to know who's authorizing, and the real session is Firebase's, `src/lib/auth/firebase-bridge-plugin.ts` exposes `POST /api/auth/firebase-bridge`: given a valid Firebase session cookie, it creates (or reuses) a better-auth `users` row keyed by the same Firebase UID and a real better-auth session. Call it before any session-gated `authClient` call from a page that only has a Firebase session so far (see `src/components/auth/settings/provider-section.tsx`'s "link" flow).

`account.encryptOAuthTokens: true` handles at-rest encryption of linked-provider tokens; there is no separate encryption helper. `packages/db/src/schema/` holds the Drizzle tables better-auth and the OAuth plugin expect (`users` doubles as the `user` model — see that file's docstring). The OAuth scope list (`read:profile`, `write:profile`, ...) is hand-maintained in two places that must be kept in sync: this app's `oauthProvider({ scopes })` config and karasu256.com's `src/app/api/permissions/sections/route.ts`.

### Passkey flow (WebAuthn)

```
Client → POST /api/passkey/authenticate/challenge  → challenge stored in cookie
Client → browser startAuthentication()
Client → POST /api/passkey/authenticate/verify     → returns Firebase custom token
Client → signInWithCustomToken()                   → triggers onAuthStateChanged → session cookie
```

Registration follows the same challenge/verify pattern under `/api/passkey/register/`.

Credentials are stored in **Firebase Realtime Database**:

- `/passkey-index/{credentialID}` → `{ uid }` — lookup index to resolve which user owns a credential
- `/passkeys/{uid}/credentials/{credentialID}` → `{ id, publicKey, counter, transports[] }`

### Dual Firebase SDK pattern

| Context                     | Module                    | Purpose                                                          |
| --------------------------- | ------------------------- | ---------------------------------------------------------------- |
| Browser / Client Components | `src/lib/firebase/`       | Firebase JS SDK (auth, app)                                      |
| Server / API Routes         | `src/lib/firebase-admin/` | Firebase Admin SDK (session cookies, Realtime DB, custom tokens) |

Never import firebase-admin in client components or `src/lib/firebase/` in API routes.

Each module has a `schema.ts` that validates its environment variables with Zod and throws `ZodError` on missing/invalid values.

### Client-side API utilities (`src/lib/api/`)

Thin `fetch` wrappers called from client components. They abstract the API routes so components never call `fetch` directly:

- `auth-session.ts` — `createSession(idToken)` / `clearSession()`
- `passkey-authenticate.ts` — `authenticateWithPasskey()` (returns Firebase custom token)
- `passkey-register.ts` — `registerPasskey(email)`
- `passkey-credentials.ts` — `listPasskeyCredentials()` / `deletePasskeyCredential(id)`

### UI

- **shadcn/ui** (`src/components/ui/`) with Tailwind CSS v4 and CSS variables. Style is `base-nova`, base color `neutral`.
- **FontAwesome** for icons (configured in `layout.tsx` with `autoAddCss = false`).
- **Skeleton** components for loading states (never spinners or ellipsis text).
- Path alias: `@/` → `src/`.

### Pages

| Route             | Component           | Access                                                          |
| ----------------- | ------------------- | --------------------------------------------------------------- |
| `/`               | `SignInCard`        | Unauthenticated only                                            |
| `/dashboard`      | `AccountCard`       | Authenticated only                                              |
| `/reset-password` | `ResetPasswordForm` | Public                                                          |
| `/oauth/consent`  | `ConsentClient`     | Authenticated only (better-auth `oauthProvider` consent screen) |
