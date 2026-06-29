#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$1" && pwd)"
shift

ROOT="$(git -C "$APP_DIR" rev-parse --show-toplevel)"
PROJECT_JSON="$APP_DIR/.vercel/project.json"

export VERCEL_PROJECT_ID
export VERCEL_ORG_ID
VERCEL_PROJECT_ID="$(node -p "require('$PROJECT_JSON').projectId")"
VERCEL_ORG_ID="$(node -p "require('$PROJECT_JSON').orgId")"

cd "$ROOT"
exec vercel deploy "$@"
