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
DOTENVX="$ROOT/node_modules/.bin/dotenvx"

# Block .env.keys from being committed — private decryption keys must stay local.
if git diff --cached --name-only | grep -q '\.env\.keys$'; then
  echo "pre-commit: ERROR — .env.keys is staged. Private keys must not be committed." >&2
  echo "  Run: git restore --staged <path>/.env.keys" >&2
  exit 1
fi

encrypt_and_stage() {
  local abs="$1"
  local dir
  dir="$(dirname "$abs")"
  echo "pre-commit: encrypting ${abs#"$ROOT/"}"
  (cd "$dir" && "$DOTENVX" encrypt -f "$(basename "$abs")")
  git add "$abs"
}

# Track files already handled to avoid encrypting twice.
declare -A handled

# Step 1: Scan every subproject for .env.local.unencrypted.
# If the unencrypted file is newer than (or replaces) .env.local, sync and encrypt.
while IFS= read -r unenc; do
  local_abs="${unenc%.unencrypted}"
  if [ ! -f "$local_abs" ] || [ "$unenc" -nt "$local_abs" ]; then
    echo "pre-commit: syncing ${unenc#"$ROOT/"} → ${local_abs#"$ROOT/"}"
    cp "$unenc" "$local_abs"
    encrypt_and_stage "$local_abs"
    handled["$local_abs"]=1
  fi
done < <(find "$ROOT" \
  -name ".env.local.unencrypted" \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*")

# Step 2: Encrypt any remaining staged .env.local files not covered by step 1.
while IFS= read -r rel; do
  [[ "$rel" =~ \.env\.local$ ]] || continue
  abs="$ROOT/$rel"
  [ -f "$abs" ] || continue
  [ "${handled[$abs]+_}" ] && continue
  encrypt_and_stage "$abs"
done < <(git diff --cached --name-only)
