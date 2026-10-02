import { Actions } from './actions';
import { BitmaskBuilder } from './bitmask-builder';
import { ProfilePermission } from './profile-permission';

export { Actions } from './actions';
export { AbstractPermission } from './abstract-permission';
export { BitmaskBuilder } from './bitmask-builder';
export { ProfilePermission } from './profile-permission';

/** Every permission the platform can grant, grouped by resource. */
export const Permissions = {
  profile: {
    read: new ProfilePermission(Actions.Read),
    write: new ProfilePermission(Actions.Write),
  },
} as const;

type PermissionGroups = typeof Permissions;

/** Union of every registered permission type. */
export type Permission = { [R in keyof PermissionGroups]: PermissionGroups[R][keyof PermissionGroups[R]] }[keyof PermissionGroups];

/** Flat list of every registered permission. */
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(Permissions).flatMap((group) => Object.values(group));

/** Bitmask builder over {@link ALL_PERMISSIONS}. */
export const permissionBitmask = new BitmaskBuilder<Permission>(ALL_PERMISSIONS);
