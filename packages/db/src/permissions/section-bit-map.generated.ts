/**
 * GENERATED FILE — do not edit by hand.
 *
 * Maintained by `apps/karasu256.com/scripts/generate-route-permissions.ts`,
 * which scans API routes for `@Read`/`@Write` section keys and appends any
 * new key here with the next free bit position. Run
 * `pnpm --filter apps/karasu256.com run generate:route-permissions` after
 * adding a new `@Read`/`@Write` section key to a route.
 *
 * Existing entries must never change or be removed: their bit position is
 * encoded into permission bitmasks already persisted on OAuth access tokens
 * and authorization codes.
 */
export const SECTION_BIT_MAP: Record<string, number> = {
  profile: 0,
  images: 1,
};
