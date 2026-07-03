import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Identicon } from './identicon';

const IDENTICON_PIXEL_SIZE: Record<NonNullable<UserAvatarProps['size']>, number> = { sm: 24, default: 32, lg: 40 };

interface UserAvatarProps {
  /** The Firebase UID, used to derive the identicon fallback. */
  uid: string;
  /** The user's uploaded icon URL, if any. Falls back to an identicon when null/undefined. */
  iconUrl?: string | null;
  /** @default "default" */
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * Renders the user's uploaded icon, or a deterministic identicon fallback
 * derived from their UID when no icon is set. The single place that decides
 * how a user's avatar is displayed, so every app renders it consistently.
 *
 * Built on shadcn's Avatar primitive; sizing goes through its own `size`
 * prop (backed by Tailwind `data-[size=*]` variants) rather than an inline
 * pixel style, since overriding the box size that way leaves the primitive's
 * internal layout mismatched with its actual hit area.
 */
export function UserAvatar({ uid, iconUrl, size = 'default', className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {iconUrl ? (
        <AvatarImage src={iconUrl} alt="" />
      ) : (
        <AvatarFallback className="bg-transparent">
          <Identicon value={uid} size={IDENTICON_PIXEL_SIZE[size]} />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
