import { startRegistration } from "@simplewebauthn/browser";

/**
 * Runs the full passkey registration flow:
 * fetches a registration challenge, prompts the browser to create a credential,
 * and verifies the attestation with the server.
 *
 * @throws When the browser or server rejects the credential.
 */
export async function registerPasskey(email: string, name: string): Promise<void> {
  const challengeRes = await fetch("/api/passkey/register/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const challengeData = (await challengeRes.json()) as {
    options?: Parameters<typeof startRegistration>[0]["optionsJSON"];
    error?: string;
  };
  if (challengeData.error) throw new Error(challengeData.error);

  const credential = await startRegistration({ optionsJSON: challengeData.options! });

  const verifyRes = await fetch("/api/passkey/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, name }),
  });
  const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string };
  if (verifyData.error) throw new Error(verifyData.error);
}
