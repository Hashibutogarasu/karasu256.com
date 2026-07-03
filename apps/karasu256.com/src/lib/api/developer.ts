import { ApiError } from '@Hashibutogarasu/utils/client';

export interface OAuthClientSummary {
  id: string;
  name: string;
  iconUrl: string | null;
  callbackUris: string[];
  permissions: number;
  createdAt: string;
}

export interface OAuthClientCreated extends OAuthClientSummary {
  secret: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyCreated extends ApiKeySummary {
  key: string;
}

export interface SectionMeta {
  key: string;
  labelKey: string;
  descriptionKey?: string;
  readMask: number;
  writeMask: number;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listOAuthClients(): Promise<OAuthClientSummary[]> {
  const res = await fetch('/api/oauth/clients');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<OAuthClientSummary[]>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function createOAuthClient(input: {
  name: string;
  callbackUris: string[];
  iconUrl?: string;
  permissions: number;
}): Promise<OAuthClientCreated> {
  const res = await fetch('/api/oauth/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<OAuthClientCreated>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function updateOAuthClient(
  id: string,
  input: Partial<{
    name: string;
    callbackUris: string[];
    iconUrl: string | null;
    permissions: number;
  }>
): Promise<OAuthClientSummary> {
  const res = await fetch(`/api/oauth/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<OAuthClientSummary>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function deleteOAuthClient(id: string): Promise<void> {
  const res = await fetch(`/api/oauth/clients/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw ApiError.fromResponse(res);
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function rotateOAuthClientSecret(id: string): Promise<{ secret: string }> {
  const res = await fetch(`/api/oauth/clients/${id}/secret`, { method: 'POST' });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<{ secret: string }>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listApiKeys(): Promise<ApiKeySummary[]> {
  const res = await fetch('/api/api-keys');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<ApiKeySummary[]>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function createApiKey(name: string): Promise<ApiKeyCreated> {
  const res = await fetch('/api/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<ApiKeyCreated>;
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function deleteApiKey(id: string): Promise<void> {
  const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw ApiError.fromResponse(res);
}

/**
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function getPermissionSections(): Promise<SectionMeta[]> {
  const res = await fetch('/api/permissions/sections');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<SectionMeta[]>;
}
