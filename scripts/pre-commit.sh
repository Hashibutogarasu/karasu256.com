#!/usr/bin/env bash
# Pre-commit hook: encrypt .env.local files before committing.
#
# Workflow for plaintext editing:
#   1. Edit .env.local.unencrypted (gitignored, never committed).
#   2. Run `git commit` — this hook detects the file is newer than .env.local,
#      copies it to .env.local, encrypts it, and stages .env.local automatically.
#
# Direct staging workflow:
#   Stage .env.local directly — the hook encrypts and re-stages it.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

bash "$ROOT/scripts/check-i18n.sh"

# Block .env.keys from being committed — private decryption keys must stay local.
if git diff --cached --name-only | grep -q '\.env\.keys$'; then
  echo "pre-commit: ERROR — .env.keys is staged. Private keys must not be committed." >&2
  echo "  Run: git restore --staged <path>/.env.keys" >&2
  exit 1
fi

# Sync and encrypt all .env.local.unencrypted files.
bash "$ROOT/scripts/sync-env.sh"

# Stage any .env.local files that were just (re-)encrypted.
while IFS= read -r unenc; do
  local_abs="${unenc%.unencrypted}"
  [ -f "$local_abs" ] && git add "$local_abs"
done < <(find "$ROOT" \
  -name ".env.local.unencrypted" \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*")

# Also encrypt and stage any .env.local directly staged by the user.
DOTENVX="$ROOT/node_modules/.bin/dotenvx"
while IFS= read -r rel; do
  [[ "$rel" =~ \.env\.local$ ]] || continue
  abs="$ROOT/$rel"
  [ -f "$abs" ] || continue
  echo "pre-commit: encrypting ${rel}"
  (cd "$(dirname "$abs")" && "$DOTENVX" encrypt -f "$(basename "$abs")")
  git add "$abs"
done < <(git diff --cached --name-only)
