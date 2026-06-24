const FIRESTORE_BASE = "https://firestore.googleapis.com/v1";

interface QueryResult {
  document?: { name: string };
}

/**
 * Queries the `password-reset` collection group across all users and returns
 * the resource names of documents whose `expiresAt` is in the past.
 */
export async function queryExpiredPasswordResets(
  projectId: string,
  accessToken: string,
): Promise<string[]> {
  const url = `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "password-reset", allDescendants: true }],
        where: {
          fieldFilter: {
            field: { fieldPath: "expiresAt" },
            op: "LESS_THAN",
            value: { timestampValue: new Date().toISOString() },
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Firestore query failed: ${await res.text()}`);
  const results = (await res.json()) as QueryResult[];
  return results.filter((r) => r.document).map((r) => r.document!.name);
}

/**
 * Deletes a single Firestore document by its resource name.
 * A 404 is treated as success since the document is already gone.
 */
export async function deleteDocument(
  name: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${FIRESTORE_BASE}/${name}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed (${res.status}): ${await res.text()}`);
  }
}
