# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

If you have read this file, respond with "にゃーん" before starting any work.

## Repository overview

This is a pnpm + Turborepo monorepo for Karasu Lab's web properties. It hosts several independently deployed Next.js apps and Cloudflare Workers that share a small set of internal packages.

## Commands

Run these from the repository root, not from inside an app directory:

```bash
pnpm dev            # Start all apps' dev servers via turbo
pnpm build          # Build all apps via turbo
pnpm lint           # Lint all apps via turbo
pnpm format         # Format the whole repo with Prettier
pnpm format:check   # Check formatting without writing
```

To target a single app or package, use turbo's filter flag, e.g. `pnpm --filter accounts.karasu256.com build` or `pnpm --filter accounts.karasu256.com dev`.

Each app under `apps/*` may have its own `CLAUDE.md` with app-specific commands and architecture notes — check there first before editing that app.

## Shell command style

**Never use `echo` as a visual separator between chained shell commands.** It doesn't matter which character fills the separator — dashes, equals signs, asterisks, or anything else — it adds no information, only noise, to the output and transcript.

❌ Bad:

```bash
pnpm build && echo --- && pnpm test
```

```bash
git add file.ts && echo "=== staged ===" && git status
```

✅ Good:

```bash
pnpm build && pnpm test
```

```bash
git add file.ts && git status
```

If a command's output needs to be told apart from another's, run them as separate tool calls instead of concatenating them with an `echo` separator.

## Architecture

### Apps (`apps/*`)

- **karasu256.com** — the main marketing/landing Next.js site. Home page is a drag-and-drop playground with a persisted-placement sidebar showing the signed-in user's profile (via cross-origin session lookup), plus `/settings/profile`, `/settings/developer`, `/settings/other`, an OAuth test-callback route, and API routes for permissions, user, profile, and API keys.
- **accounts.karasu256.com** — the account portal: sign-in/out, passkey management, and the monorepo's single better-auth instance, which also acts as the OAuth 2.1/OIDC authorization server for the other apps.
- **cdn.karasu256.com** — an Elysia app on Cloudflare Workers that serves as the image/file CDN: public routes serve images by path, protected/anonymous routes handle upload and delete, backed by CORS, rate-limiting, and auth middleware.
- **qr.karasu256.com** — a Next.js app that generates and displays a per-user (or anonymous) QR code linking to their profile/content, uploading the generated image through the CDN and caching the result in Redis.
- **cron-jobs** — a Cloudflare Worker (`wrangler`) scaffold for scheduled jobs, depending on `@Hashibutogarasu/db` for future DB-backed tasks.

### Packages (`packages/*`)

- **db** — shared Drizzle ORM/Postgres data layer: schema for users, auth sessions/accounts/verifications/JWKs, passkeys, API keys, and OAuth (clients, consents, access/refresh tokens), plus query helpers.
- **ui** — shared React component library (base-ui/shadcn-based): Button, Dialog, Card, Tabs, Sidebar/SettingsSidebar, Identicon/UserAvatar, R2Image, toast/Toaster, and a Redis client provider.
- **utils** — shared server/client utilities: session/auth helpers, image upload/delete helpers, email templates, Zod validation, and shared constants.

## Rules

- See "Shell command style" above for the `echo`-separator rule.
- For small, targeted edits, verify with a type check only (e.g. `pnpm --filter <app> exec tsc --noEmit`, or whatever the app's `CLAUDE.md` documents) rather than running a full `build`. Reserve full builds for larger changes or before opening a PR.
- When a change spans multiple apps or packages, verify it with a single root `pnpm build` (not scoped `--filter` builds) so cross-package effects are caught. When a change is scoped to a single app or package, verify with that app/package alone instead. Run the build once per change — don't re-run it again unless the code changes further.
- After opening a pull request, do not proactively offer to watch, babysit, or auto-fix CI for it. Only start monitoring a PR if the user explicitly asks.
- Before starting any work, always confirm what the repository's actual default branch is (e.g. via the GitHub API/CLI) rather than assuming `main` or `dev`. Branch and open pull requests from that default branch.
- Before creating a pull request for a branch, check whether that branch's existing pull request (if any) has already been merged.
- If it has been merged, open a new pull request from a fresh branch off the default branch rather than reusing the merged one.
- If the change addresses a different concern than an existing open pull request, open a separate pull request for it instead of adding to the existing one.
- Only add commits to an existing pull request's branch when the user explicitly asks for that.
- Never chain pull requests — i.e. never base a new branch/PR on another feature branch instead of the default branch — unless the user explicitly permits it for that specific case. A base branch can be merged (or otherwise become stale) before the chained PR merges, silently dropping the chained PR's changes from the default branch even though GitHub shows it as merged.
- If `drizzle-kit migrate` reports success but an expected table is still missing (e.g. `relation "passkey" does not exist`), suspect the migration's timestamp before the SQL itself. drizzle-orm's `pg-core` dialect only applies a migration whose `meta/_journal.json` entry `"when"` is strictly greater than the max `created_at` already recorded in `drizzle.__drizzle_migrations`; otherwise it silently skips it with no error. This happens when a baseline migration is committed for a database that already has older, untracked migration history recorded in that table (e.g. `"when": 1783988364766` gets skipped because `drizzle.__drizzle_migrations` already has a row with `created_at >= 1783988364766`). Fix it by regenerating `"when"` to the current `Date.now()` so it is guaranteed newer than anything already applied.
- When investigating how a third-party library actually works, do not read compiled/vendored output such as `node_modules`, `dist`, or `.next`.
- Instead, ask the user which repository and branch to clone (e.g. via AskUserQuestion).
- Once the user responds, clone that repository/branch into a temporary directory and investigate from there.
- Do not stop to ask for confirmation on actions already authorized by these rules or by the user's instructions (e.g. recreating a branch off the default branch, opening a non-draft PR) — just proceed.
- Re-read the root `CLAUDE.md` every 2-3 turns so its rules stay in effect over a long conversation.
- Prefer responding in Japanese.
- Never start a dev/prod server (`pnpm dev`, `pnpm start`, `next dev`, `next start`, `wrangler dev`, etc.) on your own initiative, including as a way to investigate or verify a bug. Only start one when the user explicitly asks for it.
- Never open or drive a browser (e.g. Chrome/Chromium automation) to inspect or test the app on your own initiative. Only do so when the user explicitly asks for it. Diagnose and verify changes by reading code, running builds/type checks, and reasoning about behavior instead.
