import type { AbstractPermission } from './abstract-permission';
import type { PermissionRecord, PermissionRepository } from './permission-repository';
import { permissionBitmask, type Permission } from './registry';
import type { PermissionSummary } from './types';

export class UnknownPermissionError extends Error {}

/** Rows whose numeric id the code registry doesn't know are skipped, so the catalog can run ahead of a deploy. */
function toSummary(record: PermissionRecord): PermissionSummary | null {
  const permission = permissionBitmask.fromId(record.numericId);
  if (!permission) return null;
  return { publicId: record.publicId, numericId: record.numericId, resource: permission.resource(), action: permission.action() };
}

function toSummaries(records: readonly PermissionRecord[]): PermissionSummary[] {
  return records.map(toSummary).filter((summary): summary is PermissionSummary => summary !== null);
}

export class PermissionService {
  private readonly repository: PermissionRepository;

  constructor(repository: PermissionRepository) {
    this.repository = repository;
  }

  async listActivePermissions(): Promise<PermissionSummary[]> {
    return toSummaries(await this.repository.findActive());
  }

  /** Rejects the whole grant when any public id is unknown, so a key never ends up with a partial set. */
  async grant(apiKeyId: string, publicIds: readonly string[]): Promise<PermissionSummary[]> {
    const uniquePublicIds = [...new Set(publicIds)];
    const records = uniquePublicIds.length === 0 ? [] : await this.repository.findActiveByPublicIds(uniquePublicIds);
    if (records.length !== uniquePublicIds.length) throw new UnknownPermissionError();
    if (records.length > 0)
      await this.repository.grant(
        apiKeyId,
        records.map((record) => record.id)
      );
    return toSummaries(records);
  }

  async getGrantedPermissions(apiKeyIds: readonly string[]): Promise<Map<string, PermissionSummary[]>> {
    const granted = new Map<string, PermissionSummary[]>();
    if (apiKeyIds.length === 0) return granted;

    for (const { apiKeyId, permission } of await this.repository.findGranted(apiKeyIds)) {
      const summary = toSummary(permission);
      if (!summary) continue;
      granted.set(apiKeyId, [...(granted.get(apiKeyId) ?? []), summary]);
    }
    return granted;
  }

  async resolve(apiKeyId: string): Promise<Permission[]> {
    const granted = (await this.getGrantedPermissions([apiKeyId])).get(apiKeyId) ?? [];
    return granted
      .map((summary) => permissionBitmask.fromId(summary.numericId))
      .filter((permission): permission is Permission => permission !== undefined);
  }

  async resolveBitmask(apiKeyId: string): Promise<bigint> {
    const permissions: AbstractPermission[] = await this.resolve(apiKeyId);
    return permissionBitmask.build(permissions);
  }
}
