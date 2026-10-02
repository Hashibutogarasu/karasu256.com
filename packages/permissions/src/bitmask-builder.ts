import type { AbstractPermission } from './abstract-permission';

/** Returns the single-bit mask for `permission`'s numeric id. */
function bitFor(permission: AbstractPermission): bigint {
  return BigInt(1) << BigInt(permission.id());
}

/** Converts between lists of permissions and bitmasks keyed by each permission's numeric id. */
export class BitmaskBuilder<TPermission extends AbstractPermission> {
  private readonly byId: ReadonlyMap<number, TPermission>;

  constructor(registry: readonly TPermission[]) {
    const byId = new Map<number, TPermission>();
    for (const permission of registry) {
      if (byId.has(permission.id())) throw new Error(`Duplicate permission id ${permission.id()}`);
      byId.set(permission.id(), permission);
    }
    this.byId = byId;
  }

  /** Returns a bitmask with the bit at each permission's numeric id set. */
  build(permissions: readonly AbstractPermission[]): bigint {
    return permissions.reduce((mask, permission) => mask | bitFor(permission), BigInt(0));
  }

  /** Returns the registered permissions whose bits are set in `mask`. */
  parse(mask: bigint): TPermission[] {
    return [...this.byId.values()].filter((permission) => (mask & bitFor(permission)) !== BigInt(0));
  }

  /** Returns the registered permission with the given numeric id, or `undefined` if none is registered. */
  fromId(id: number): TPermission | undefined {
    return this.byId.get(id);
  }
}
