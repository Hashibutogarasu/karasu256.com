# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start the dev server (http://localhost:3001)
pnpm build      # Production build
pnpm lint       # Run ESLint
pnpm test:e2e   # Playwright E2E suite (e2e/multi-account.spec.ts)
```

Add shadcn components with `pnpm dlx shadcn@latest add <component>`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in all values before running locally. `proxy.ts` validates Firebase env vars on every request and returns HTTP 500 if any are missing (Firebase is still required — see Architecture below).

`FIREBASE_ADMIN_PRIVATE_KEY` may contain literal `\n` sequences from hosting panels — `parseFirebaseAdminEnv()` normalizes them automatically.

## Architecture

This is a **Next.js 16 App Router** account portal for Karasu Lab. Its sole purpose is sign-in, sign-out, passkey management, and third-party OAuth authorization.

### Authentication flow (better-auth)

**better-auth is the sole session authority** — the single instance lives here (`src/lib/auth/server.ts`, mounted at `/api/auth/[...all]`), and every other app in the monorepo (karasu256.com, qr.karasu256.com, cdn.karasu256.com) verifies "who is logged in" only via a remote call to this app (`packages/utils/src/server/session.ts`'s `getSessionUser()`).

1. The client signs in via one of `authClient.signIn.email()`, `authClient.signIn.passkey()`, or `authClient.signIn.social()` (`sign-in-card.tsx`). Each establishes a real better-auth session directly — none of them touch Firebase client-side.
2. `nextCookies()` sets the session cookie. Its name is fixed to `BETTER_AUTH_SESSION_COOKIE_NAME` (`advanced.cookies.session_token.name` in `auth-options.ts`) rather than better-auth's versioned default, so other apps that only hold this cookie's raw value can name it without depending on better-auth internals. In production, better-auth still prepends the `__Secure-` prefix on top of that custom name.
3. `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) gates `/settings` (requires the session cookie) and `/` (redirects away if present). It checks the cookie **by raw name** (`__Secure-${BETTER_AUTH_SESSION_COOKIE_NAME}` falling back to the unprefixed name), not via `better-auth/cookies`' `getSessionCookie()` helper — that helper only knows how to look up `<prefix>.session_token`-style names and can't be configured to match this app's flat custom name. Full cookie verification (signature + expiry) happens inside individual API routes and server components via `auth.api.getSession()` (`src/lib/session-user.ts`) — the Firebase Admin SDK dependency elsewhere in this file is not Edge-compatible, which is _why_ `proxy.ts` only checks cookie presence.
4. Client components read the session reactively via `authClient.useSession()` (see `sign-in-card.tsx`, `account-card.tsx`, `settings/shell.tsx`, `settings/provider-section.tsx`) — there is no `onAuthStateChanged` watcher anywhere in this app anymore.

### Firebase Auth: backing ID/profile store, not a session

Firebase Auth is no longer read for session state anywhere in this app. It remains wired in purely as a backing identity/profile store, entirely through `databaseHooks` in `auth-options.ts` (implementations in `src/lib/auth/hooks.ts`):

- `databaseHooks.user.create.before` → `provisionFirebaseUser`: creates a matching Firebase user for every new better-auth user (regardless of which sign-in flow created it — email/password, passkey, or social) and forces better-auth's `user.id` to equal the resulting Firebase UID. Every table and R2/CDN storage path in this monorepo is keyed by that id, so this invariant matters everywhere, not just here.
- `databaseHooks.user.update.after` → `syncProfileToFirebase`: mirrors `name`/`image` onto the Firebase user after any profile edit.
- `user.deleteUser.afterDelete` → `deleteFirebaseUser`: removes the Firebase user once better-auth has deleted its own row. `user.deleteUser.enabled: true` in `auth-options.ts` is what makes `authClient.deleteUser()` available at all (`danger-zone.tsx`).

No page or route reads Firebase's own session (there is no more `onAuthStateChanged`, session cookie, or custom-token minting for sign-in purposes). The Firebase **Client SDK** (`src/lib/firebase/auth.ts`, `getFirebaseAuth()`) is consequently unused in current app code — kept for now, not deleted, since nothing currently depends on removing it. `src/lib/firebase/schema.ts` (env var validation) is still live, used by `proxy.ts`.

### OAuth 2.1 / OIDC authorization server

`@better-auth/oauth-provider` turns this instance into an authorization server for third-party apps — `/oauth2/authorize`, `/oauth2/token`, `/oauth2/consent` (UI at `src/app/oauth/consent/`), etc. Client management UI lives on karasu256.com's `/settings/developer`, calling this app's endpoints via `authClient.oauth2.*`.

`@better-auth/oauth-provider` only issues a **JWT** access token (locally verifiable, no DB read — see karasu256.com's `route-auth.ts`) when the token request includes a `resource` parameter (RFC 8707) matching `validAudiences` (defaults to this app's own internal `baseURL`). Without it, the token is opaque and karasu256.com's JWT-only verification rejects it with 401. Note `baseURL` internally includes the auth mount path — the `iss`/`aud`/JWKS identifier is `${BETTER_AUTH_URL}/api/auth`, not just `BETTER_AUTH_URL` — confirmed by decoding a real `/oauth2/authorize` redirect's `iss` query param. Every client calling `/oauth2/token` — including the "test client" dialog in developer settings — must send `resource=${BETTER_AUTH_URL}/api/auth`.

`account.encryptOAuthTokens: true` handles at-rest encryption of linked-provider tokens; there is no separate encryption helper. `packages/db/src/schema/` holds the Drizzle tables better-auth and the OAuth plugin expect (`users` doubles as the `user` model — see that file's docstring). The OAuth scope list (`read:profile`, `write:profile`, ...) is hand-maintained in two places that must be kept in sync: this app's `oauthProvider({ scopes })` config and karasu256.com's `src/app/api/permissions/sections/route.ts`.

### Passkey flow (WebAuthn)

Passkeys run entirely on the official `@better-auth/passkey` plugin (registered in `server.ts` with `rpID`/`rpName`/`origin` from `getServerConfig().webauthn`) — there is no custom challenge/verify route or `@simplewebauthn` dependency anymore. Credentials live in Postgres (`packages/db/src/schema/passkeys.ts`, the `passkey` table), not Firebase Realtime Database.

- Sign-in: `authClient.signIn.passkey()` (`passkey-section.tsx`).
- Adding a passkey to an already-authenticated account: `authClient.passkey.addPasskey()` (`passkey-create-dialog.tsx`).
- Listing/removing: `authClient.passkey.listUserPasskeys()` / the plugin's revoke endpoint (`passkey-list.tsx`).

### Account switching (multiSession)

Multiple concurrent accounts on one device run entirely on the `multiSession` plugin's standard API — `auth.api.setActiveSession` / `authClient.multiSession.setActive()`. Adding a second account (`add-account-dialog.tsx`) is just an ordinary sign-in while a session already exists: `multiSession`'s `after` hook automatically tracks it as an additional device session instead of replacing the current one. `accounts/switch/route.ts` and `accounts/remove/route.ts` are thin wrappers around `setActiveSession`/`revokeDeviceSession` — there is no Firebase-cookie bridging or custom-token minting involved.

### Dual Firebase SDK pattern (Admin SDK only, in practice)

| Context                     | Module                    | Purpose                                                                          |
| --------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| Browser / Client Components | `src/lib/firebase/`       | Firebase JS SDK — `schema.ts` (env validation) is live; `auth.ts` is unused      |
| Server / API Routes         | `src/lib/firebase-admin/` | Firebase Admin SDK — user provisioning/profile sync/deletion via `databaseHooks` |

Never import firebase-admin in client components or `src/lib/firebase/` in API routes.

Each module has a `schema.ts` that validates its environment variables with Zod and throws `ZodError` on missing/invalid values.

### Client/server helpers (`src/lib/api/`)

- `accounts.ts` — client: `listAccounts()` / `switchAccount(sessionToken)` / `removeAccount(sessionToken)`.
- `set-password.ts` — client: `setPassword(newPassword)`, wrapping the server-only `auth.api.setPassword` via `POST /api/auth/set-password` (better-auth's `setPassword` has no client-callable counterpart, unlike `changePassword`).
- `require-session.ts` / `responses.ts` — server: `requireSession()` wraps `session-user.ts`'s `getSessionUser()` for Route Handlers that need a 401 on missing auth.

### UI

- **shadcn/ui** (`src/components/ui/`) with Tailwind CSS v4 and CSS variables. Style is `base-nova`, base color `neutral`.
- **FontAwesome** for icons (configured in `layout.tsx` with `autoAddCss = false`).
- **Skeleton** components for loading states (never spinners or ellipsis text).
- Path alias: `@/` → `src/`.

### Pages

| Route                | Component                               | Access                                                                                                        |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/`                  | `SignInCard`                            | Unauthenticated only                                                                                          |
| `/settings`          | `SettingsShell` + `ProfileSection`/etc. | Authenticated only                                                                                            |
| `/settings/security` | `SecurityClient`                        | Authenticated only                                                                                            |
| `/settings/linking`  | `ProviderSectionClient`                 | Authenticated only                                                                                            |
| `/reset-password`    | `ResetPasswordForm`                     | Public                                                                                                        |
| `/auth/callback`     | `OAuthCallbackClient`                   | Post-social-sign-in transition page; confirms the better-auth session landed before continuing to `/settings` |
| `/oauth/consent`     | `ConsentClient`                         | Authenticated only (better-auth `oauthProvider` consent screen)                                               |
