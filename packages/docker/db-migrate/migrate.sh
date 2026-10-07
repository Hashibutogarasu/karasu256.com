#!/bin/sh
set -e
for app in accounts qr; do
  echo "Applying ${app} migrations"
  MIGRATIONS_DIR="/migrations/${app}" MIGRATIONS_TABLE="__drizzle_migrations_${app}" npx drizzle-kit migrate --config drizzle.config.mjs
done
