export interface LinkedProvider {
  provider: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/** Returns the list of third-party providers linked to the current user. */
export async function listLinkedProviders(): Promise<LinkedProvider[]> {
  const res = await fetch("/api/linked-providers");
  if (!res.ok) throw new Error("Failed to fetch linked providers");
  return res.json() as Promise<LinkedProvider[]>;
}

/** Unlinks the given provider from the current user's account. */
export async function unlinkProvider(provider: string): Promise<void> {
  const res = await fetch(`/api/linked-providers/${encodeURIComponent(provider)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to unlink provider");
}
