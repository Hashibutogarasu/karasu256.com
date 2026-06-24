export interface OAuthClientSummary {
  id: string;
  name: string;
  iconUrl: string | null;
  callbackUri: string;
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

export async function listOAuthClients(): Promise<OAuthClientSummary[]> {
  const res = await fetch("/api/oauth/clients");
  if (!res.ok) throw new Error("Failed to fetch OAuth clients");
  return res.json() as Promise<OAuthClientSummary[]>;
}

export async function createOAuthClient(input: {
  name: string;
  callbackUri: string;
  iconUrl?: string;
  permissions: number;
}): Promise<OAuthClientCreated> {
  const res = await fetch("/api/oauth/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create OAuth client");
  return res.json() as Promise<OAuthClientCreated>;
}

export async function deleteOAuthClient(id: string): Promise<void> {
  const res = await fetch(`/api/oauth/clients/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete OAuth client");
}

export async function listApiKeys(): Promise<ApiKeySummary[]> {
  const res = await fetch("/api/api-keys");
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json() as Promise<ApiKeySummary[]>;
}

export async function createApiKey(name: string): Promise<ApiKeyCreated> {
  const res = await fetch("/api/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create API key");
  return res.json() as Promise<ApiKeyCreated>;
}

export async function deleteApiKey(id: string): Promise<void> {
  const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete API key");
}

export async function getPermissionSections(): Promise<SectionMeta[]> {
  const res = await fetch("/api/permissions/sections");
  if (!res.ok) throw new Error("Failed to fetch permission sections");
  return res.json() as Promise<SectionMeta[]>;
}
