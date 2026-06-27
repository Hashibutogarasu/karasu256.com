export interface SectionMeta {
  key: string;
  /** i18n translation key for the section label. */
  labelKey: string;
  /** i18n translation key for the section description. */
  descriptionKey?: string;
  /**
   * Fixed bit position index. Must never change after data is written to the database,
   * as existing permission bitmask values would become invalid.
   *
   * readMask  = 1n << BigInt(bitIndex * 2)
   * writeMask = 1n << BigInt(bitIndex * 2 + 1)
   */
  bitIndex: number;
  readMask: bigint;
  writeMask: bigint;
}

const registry: SectionMeta[] = [];

export function registerSection(
  meta: Omit<SectionMeta, "readMask" | "writeMask">,
): void {
  if (registry.some((s) => s.bitIndex === meta.bitIndex)) {
    throw new Error(
      `@Section bitIndex ${meta.bitIndex} is already registered by another section.`,
    );
  }
  registry.push({
    ...meta,
    readMask: 1n << BigInt(meta.bitIndex * 2),
    writeMask: 1n << BigInt(meta.bitIndex * 2 + 1),
  });
}

/** Returns all registered permission sections in registration order. */
export function getRegisteredSections(): readonly SectionMeta[] {
  return registry;
}

/**
 * Decodes a permission bitmask into per-section read/write flags.
 */
export function decodePermissions(
  mask: bigint,
): Array<{ key: string; read: boolean; write: boolean }> {
  return registry.map((s) => ({
    key: s.key,
    read: (mask & s.readMask) !== 0n,
    write: (mask & s.writeMask) !== 0n,
  }));
}

/**
 * Returns true when the given bitmask grants the specified permission for a section.
 *
 * @param mask - The permissions bitmask stored on a token or authorization code.
 * @param key - The section key (e.g. `"profile"`).
 * @param mode - `"read"` (default) or `"write"`.
 */
export function hasPermission(
  mask: bigint,
  key: string,
  mode: "read" | "write" = "read",
): boolean {
  const section = registry.find((s) => s.key === key);
  if (!section) return false;
  const bit = mode === "read" ? section.readMask : section.writeMask;
  return (mask & bit) !== 0n;
}
