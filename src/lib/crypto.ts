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

  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { raw, hash };
}
