#!/usr/bin/env bash
# Pre-commit check: abort if any locale has untranslated keys.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"

if ! (cd "$ROOT/apps/karasu256.com" && npx i18next-cli status); then
  echo "check-i18n: ERROR — Missing translations detected. Complete all translations before committing." >&2
  exit 1
fi
