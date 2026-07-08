export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Checks whether an explicit upload path matches one of the known key
 * schemes. `users/:uid/avatar.png` additionally requires the `:uid` segment
 * to match the authenticated caller, since the worker has no other way to
 * stop one user from overwriting another user's avatar.
 */
export function isValidUploadPath(path: string, uid: string): boolean {
  const avatarMatch = path.match(/^users\/([^/]+)\/avatar\.png$/);
  if (avatarMatch) return avatarMatch[1] === uid;

  const qrMatch = path.match(/^qr\/([^/]+)\/(\d+)\.png$/);
  if (qrMatch) return qrMatch[1] === uid;

  return /^oauth\/([^/]+)\/icon\.png$/.test(path);
}

/**
 * Checks whether an anonymous upload path matches the fixed
 * `qr/anonymous/{datetime}.png` scheme, since anonymous callers have no uid
 * to scope a path to.
 */
export function isValidAnonymousUploadPath(path: string): boolean {
  return /^qr\/anonymous\/\d+\.png$/.test(path);
}
