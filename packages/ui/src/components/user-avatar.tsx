import { cn } from '../lib/utils';
import { Identicon } from './identicon';

interface UserAvatarProps {
  /** The Firebase UID, used to derive the identicon fallback. */
  uid: string;
  /** The user's uploaded icon URL, if any. Falls back to an identicon when null/undefined. */
  iconUrl?: string | null;
  /** Width and height in pixels. @default 64 */
  size?: number;
  className?: string;
}

/**
 * Renders the user's uploaded icon, or a deterministic identicon fallback
 * derived from their UID when no icon is set. The single place that decides
 * how a user's avatar is displayed, so every app renders it consistently.
 */
export function UserAvatar({ uid, iconUrl, size = 64, className }: UserAvatarProps) {
  if (iconUrl) {
    return <img src={iconUrl} alt="" style={{ width: size, height: size }} className={cn('rounded-full object-cover shrink-0', className)} />;
  }
  return <Identicon value={uid} size={size} className={className} />;
}
