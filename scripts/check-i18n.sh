#!/usr/bin/env bash
# Pre-commit check: abort if any locale has untranslated keys.
set -euo pipefail

I18N_STATUS=$(npx i18next-cli status 2>&1)
echo "$I18N_STATUS"

if echo "$I18N_STATUS" | grep -E '[0-9]+% \([0-9]+/[0-9]+ keys\)' | grep -qv '100%'; then
  echo "check-i18n: ERROR — Missing translations detected. Complete all translations before committing." >&2
  exit 1
fi
