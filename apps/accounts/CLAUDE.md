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

| Route             | Component           | Access               |
| ----------------- | ------------------- | -------------------- |
| `/`               | `SignInCard`        | Unauthenticated only |
| `/dashboard`      | `AccountCard`       | Authenticated only   |
| `/reset-password` | `ResetPasswordForm` | Public               |
