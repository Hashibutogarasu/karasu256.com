import { ApiError } from '@Hashibutogarasu/utils/client';
import { authClient, bridgeFirebaseSession } from '@/lib/auth/client';

export interface AuthorizedAppSummary {
  /** The `oauthConsent` row's own id — required to revoke via `deleteOAuthConsent`. */
  id: string;
  clientId: string;
  name: string;
  iconUrl: string | null;
  scopes: string[];
}

interface OAuthConsentRow {
  id: string;
  clientId: string;
  scopes: string[];
}

interface PublicClient {
  client_id: string;
  client_name?: string;
  logo_uri?: string;
}

/**
 * Returns all OAuth clients the current user has granted consent to.
 *
 * @throws {ApiError} When the request fails.
 */
export async function listAuthorizedApps(): Promise<AuthorizedAppSummary[]> {
  await bridgeFirebaseSession();

  const { data: consents, error } = await authClient.oauth2.getConsents();
  if (error) throw new ApiError(error.status, error.message ?? 'Request failed');

  const rows = (consents ?? []) as OAuthConsentRow[];
  return Promise.all(
    rows.map(async (row) => {
      const { data: client } = await authClient.oauth2.publicClient({ query: { client_id: row.clientId } });
      const publicClient = client as PublicClient | null;
      return {
        id: row.id,
        clientId: row.clientId,
        name: publicClient?.client_name ?? row.clientId,
        iconUrl: publicClient?.logo_uri ?? null,
        scopes: row.scopes,
      };
    })
  );
}

/**
 * Revokes the given consent, so the client can no longer be issued new
 * tokens on the granted scopes. Already-issued JWT access tokens remain
 * valid until they expire.
 *
 * @throws {ApiError} When the request fails.
 */
export async function revokeAuthorizedApp(consentId: string): Promise<void> {
  await bridgeFirebaseSession();
  const { error } = await authClient.oauth2.deleteConsent({ id: consentId });
  if (error) throw new ApiError(error.status, error.message ?? 'Request failed');
}
