import { z } from "zod"

/**
 * Returns the value if it parses as a string, otherwise `null`.
 *
 * @param value - Untrusted value to check (e.g. a JWT claim, a search param).
 */
export function stringOrNull(value: unknown): string | null {
  const result = z.string().safeParse(value)
  return result.success ? result.data : null
}
