import type { CredentialSummary } from "@/app/api/passkey/credentials/route";

/**
 * Returns all passkey credentials registered for the authenticated user.
 *
 * @throws When the server returns an error.
 */
export async function listPasskeyCredentials(idToken: string): Promise<CredentialSummary[]> {
  const res = await fetch("/api/passkey/credentials", {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = (await res.json()) as { credentials?: CredentialSummary[]; error?: string };
  if (data.error) throw new Error(data.error);
  return data.credentials ?? [];
}

/** Deletes a single passkey credential by ID. */
export async function deletePasskeyCredential(credentialId: string, idToken: string): Promise<void> {
  await fetch(`/api/passkey/credentials/${encodeURIComponent(credentialId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
  });
}
