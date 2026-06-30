import { startAuthentication } from "@simplewebauthn/browser";
import { PasskeyError, UnknownPasskeyError } from "./passkey-errors";

/**
 * Runs the full passkey authentication flow:
 * fetches a challenge, prompts the browser for a discoverable credential,
 * and verifies the assertion with the server.
 *
 * @returns A Firebase custom token to pass to `signInWithCustomToken`.
 * @throws {PasskeyError} When the server returns a recognised error code.
 * @throws {Error} When the server returns an unrecognised error or no token.
 */
export async function authenticateWithPasskey(): Promise<string> {
  const challengeRes = await fetch("/api/passkey/authenticate/challenge", { method: "POST" });
  const { options } = (await challengeRes.json()) as {
    options: Parameters<typeof startAuthentication>[0]["optionsJSON"];
  };

  const credential = await startAuthentication({ optionsJSON: options });

  const verifyRes = await fetch("/api/passkey/authenticate/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credential),
  });
  const data = (await verifyRes.json()) as { customToken?: string; code?: string };

  if (data.code) {
    throw PasskeyError.fromCode(data.code) ?? new UnknownPasskeyError();
  }

  if (!data.customToken) throw new UnknownPasskeyError();
  return data.customToken;
}
