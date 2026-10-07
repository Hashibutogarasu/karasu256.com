export interface PermissionRecord {
  id: string;
  publicId: string;
  numericId: number;
}

export interface GrantedPermissionRecord {
  apiKeyId: string;
  permission: PermissionRecord;
}

/** Implemented by the consuming app so this package stays runtime- and storage-agnostic. */
export interface PermissionRepository {
  findActive(): Promise<PermissionRecord[]>;
  findActiveByPublicIds(publicIds: readonly string[]): Promise<PermissionRecord[]>;
  grant(apiKeyId: string, permissionIds: readonly string[]): Promise<void>;
  findGranted(apiKeyIds: readonly string[]): Promise<GrantedPermissionRecord[]>;
}
