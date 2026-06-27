import { startAuthentication } from "@simplewebauthn/browser";

/**
 * Runs the full passkey authentication flow:
 * fetches a challenge, prompts the browser for a discoverable credential,
 * and verifies the assertion with the server.
 *
 * @returns A Firebase custom token to pass to `signInWithCustomToken`.
 * @throws When the browser or server rejects the credential.
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
  const data = (await verifyRes.json()) as { customToken?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.customToken) throw new Error("No custom token returned");
  return data.customToken;
}
