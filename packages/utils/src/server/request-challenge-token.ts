/**
 * Requests a short-lived, single-use challenge token from the image API,
 * to be embedded into the next file uploaded to its anonymous/QR upload
 * endpoints (see `@Hashibutogarasu/challengetoken`).
 */
export async function requestChallengeToken(apiUrl: string): Promise<string> {
  const res = await fetch(`${apiUrl}/challenge-token`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to obtain challenge token: ${res.status}`);

  const { token } = (await res.json()) as { token: string };
  return token;
}
