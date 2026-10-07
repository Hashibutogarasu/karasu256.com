import type { AbstractPermission } from './abstract-permission';
import type { RouteAuthContext } from './types';

/** Returns the OAuth scope string (`action:resource`, e.g. `read:profile`) that grants `permission` to an OAuth client. */
export function toOauthScope(permission: AbstractPermission): string {
  return `${permission.action()}:${permission.resource()}`;
}

/** Returns whether the caller was granted `permission`, as an API key permission or the matching OAuth scope. */
export function isPermitted(auth: RouteAuthContext, permission: AbstractPermission): boolean {
  if (auth.authMethod === 'session') return true;
  if (auth.authMethod === 'apiKey') return permission.verify(auth.permissions ?? []);
  return auth.scopes?.includes(toOauthScope(permission)) ?? false;
}
