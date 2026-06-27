import { encryptToken, decryptToken } from "@/lib/crypto";

const COOKIE_NAME = "_oauth_state";
const COOKIE_MAX_AGE = 600;

interface OAuthStateCookie {
  state: string;
  codeVerifier: string | null;
  userId: string;
}

/**
 * Serializes OAuth state into an encrypted cookie string.
 * The cookie is httpOnly, SameSite=Lax, and expires in 10 minutes.
 */
export async function buildStateCookie(value: OAuthStateCookie): Promise<string> {
  const encrypted = await encryptToken(JSON.stringify(value));
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(encrypted)}`,
    `Path=/api/auth`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  return flags;
}

/** Clears the state cookie by setting Max-Age=0. */
export function clearStateCookie(): string {
  return `${COOKIE_NAME}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Reads and decrypts the state cookie from the raw Cookie header value.
 * Returns null if the cookie is absent or cannot be decrypted.
 */
export async function readStateCookie(
  cookieHeader: string | null,
): Promise<OAuthStateCookie | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const encoded = match.slice(COOKIE_NAME.length + 1);
  try {
    const json = await decryptToken(decodeURIComponent(encoded));
    return JSON.parse(json) as OAuthStateCookie;
  } catch {
    return null;
  }
}
