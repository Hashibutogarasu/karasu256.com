import { ApiError } from "@Hashibutogarasu/utils/client";

export interface LinkedProvider {
  provider: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/**
 * Returns the list of third-party providers linked to the current user.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listLinkedProviders(): Promise<LinkedProvider[]> {
  const res = await fetch("/api/linked-providers");
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<LinkedProvider[]>;
}

/**
 * Unlinks the given provider from the current user's account.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function unlinkProvider(provider: string): Promise<void> {
  const res = await fetch(`/api/linked-providers/${encodeURIComponent(provider)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) throw ApiError.fromResponse(res);
}
