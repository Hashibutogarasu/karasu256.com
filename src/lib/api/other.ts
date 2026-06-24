export interface AuthorizedAppSummary {
  clientId: string;
  name: string;
  iconUrl: string | null;
  permissions: number;
  lastUsedAt: string | null;
}

/** Returns all OAuth clients with active tokens for the current user. */
export async function listAuthorizedApps(): Promise<AuthorizedAppSummary[]> {
  const res = await fetch("/api/oauth/authorized-apps");
  if (!res.ok) throw new Error("Failed to fetch authorized apps");
  return res.json() as Promise<AuthorizedAppSummary[]>;
}

/** Revokes all active tokens the current user has granted to the given client. */
export async function revokeAuthorizedApp(clientId: string): Promise<void> {
  const res = await fetch(`/api/oauth/authorized-apps/${clientId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to revoke authorized app");
}
