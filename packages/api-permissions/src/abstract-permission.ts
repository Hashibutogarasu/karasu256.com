import type { Actions } from './actions';

/** Base class for a single grantable permission, identified by a stable numeric id that doubles as its bit position in a bitmask. */
export abstract class AbstractPermission {
  /** Returns the resource this permission applies to, e.g. `profile`. */
  abstract resource(): string;

  /** Returns the action this permission grants on its resource. */
  abstract action(): Actions;

  /** Returns the permission's stable numeric id. */
  abstract id(): number;

  /** Returns whether this permission is among `granted`. */
  verify(granted: readonly AbstractPermission[]): boolean {
    return granted.some((permission) => permission.id() === this.id());
  }

  /** Returns the `resource:action` form of this permission, e.g. `profile:read`. */
  toString(): string {
    return `${this.resource()}:${this.action()}`;
  }
}
