import { createId } from '@paralleldrive/cuid2';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Catalog of grantable permissions. `numericId` matches `AbstractPermission.id()` in `@Hashibutogarasu/permissions`; `publicId` is what clients use to refer to a permission. */
export const permissions = pgTable('permissions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  publicId: text('public_id')
    .notNull()
    .unique()
    .$defaultFn(() => createId()),
  numericId: integer('numeric_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export type PermissionRow = typeof permissions.$inferSelect;
export type NewPermissionRow = typeof permissions.$inferInsert;
