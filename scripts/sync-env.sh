#!/usr/bin/env bash
# Syncs every .env.local.unencrypted → .env.local (encrypted) across all workspaces.
# Run before `dev:all` to ensure the dev servers pick up the latest plaintext values.
# Called automatically by the pre-commit hook for the copy+encrypt+stage flow.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
DOTENVX="$ROOT/node_modules/.bin/dotenvx"

while IFS= read -r unenc; do
  local_abs="${unenc%.unencrypted}"
  if [ ! -f "$local_abs" ] || [ "$unenc" -nt "$local_abs" ]; then
    echo "sync-env: ${unenc#"$ROOT/"} → ${local_abs#"$ROOT/"}"
    cp "$unenc" "$local_abs"
  fi
  echo "sync-env: encrypting ${local_abs#"$ROOT/"}"
  (cd "$(dirname "$local_abs")" && "$DOTENVX" encrypt -f "$(basename "$local_abs")")
done < <(find "$ROOT" \
  -name ".env.local.unencrypted" \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*")
