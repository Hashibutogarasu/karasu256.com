/**
 * Computes an FNV-1a hash of a JSON-serializable value's `JSON.stringify` output.
 * Useful for cheaply comparing snapshots (e.g. form drafts) for equality without a deep-equal check.
 */
export function hashFormData(data: unknown): string {
  const json = JSON.stringify(data);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}
