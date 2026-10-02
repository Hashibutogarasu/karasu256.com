#!/bin/sh
set -e
for app in accounts qr; do
  echo "Applying ${app} migrations"
  MIGRATIONS_DIR="/migrations/${app}" npx drizzle-kit migrate --config drizzle.config.mjs
done
