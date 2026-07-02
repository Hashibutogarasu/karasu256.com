import { ApiError } from "@Hashibutogarasu/utils/client";

/**
 * Persists the authenticated user's icon URL, or clears it when `null`.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function updateUserIcon(iconUrl: string | null): Promise<void> {
  const res = await fetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ iconUrl }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
}
