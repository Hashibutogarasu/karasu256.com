import type { AbstractPermission } from './abstract-permission';

export type RouteAuthMethod = 'apiKey' | 'oauthApp';

export interface RouteAuthContext {
  userId: string;
  authMethod: RouteAuthMethod;
  /** `null` for OAuth tokens, which carry `scopes` instead. */
  permissions: AbstractPermission[] | null;
  /** `null` for API keys, which carry `permissions` instead. */
  scopes: string[] | null;
}

/** Implemented by the consuming app so this package stays storage-agnostic. */
export interface TokenValidator {
  validateApiKey(token: string): Promise<{ userId: string; permissions: AbstractPermission[] } | null>;
  validateOauthToken(token: string): Promise<{ userId: string; scopes: string[] } | null>;
}

export interface PermissionSummary {
  publicId: string;
  numericId: number;
  resource: string;
  action: string;
}

export interface ApiKeySummary {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: string;
  lastRequest: string | null;
  permissions: PermissionSummary[];
}

/** The secret is only ever returned here, right after issuance. */
export interface ApiKeyCreated extends ApiKeySummary {
  key: string;
}
