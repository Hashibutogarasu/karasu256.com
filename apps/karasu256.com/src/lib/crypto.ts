/**
 * Returns the SHA-256 hex digest of the given string.
 * Used to verify incoming tokens against stored hashes without exposing the raw value.
 */
export async function hashSecret(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a cryptographically random secret, returning both the raw value
 * and its SHA-256 hex digest. The raw value is displayed once to the user and
 * never stored; only the hash is persisted in the database.
 */
export async function generateSecret(
  prefix: string,
): Promise<{ raw: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const base64url = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const raw = `${prefix}${base64url}`;
  const hash = await hashSecret(raw);
  return { raw, hash };
}
