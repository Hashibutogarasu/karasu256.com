import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { apiKeys } from './api-keys';
import { permissions } from './permissions';

/** Permissions granted to each API key. The bitmask is derived from these rows at verification time and never stored. */
export const apiKeyPermissions = pgTable(
  'api_key_permissions',
  {
    apiKeyId: text('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.apiKeyId, t.permissionId] })]
);

export type ApiKeyPermission = typeof apiKeyPermissions.$inferSelect;
export type NewApiKeyPermission = typeof apiKeyPermissions.$inferInsert;
