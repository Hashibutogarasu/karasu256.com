#!/usr/bin/env bash
# Pre-commit check: abort if any locale has untranslated keys.
set -uo pipefail

if ! npx i18next-cli status; then
  echo "check-i18n: ERROR — Missing translations detected. Complete all translations before committing." >&2
  exit 1
fi
