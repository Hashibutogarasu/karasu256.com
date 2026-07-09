import { OverlayContainer } from './overlay-container';
import { LoadingView } from './loading-view';

export interface SwitchingAccountOverlayProps {
  /** Whether the overlay is visible. */
  open: boolean;
  /** The status message to display while the account switch is in progress. */
  message: string;
}

/**
 * Full-screen overlay shown while the active account is being switched,
 * reusing the same card container as the sign-out screen's `LoadingView`.
 */
export function SwitchingAccountOverlay({ open, message }: SwitchingAccountOverlayProps) {
  return (
    <OverlayContainer open={open}>
      <LoadingView message={message} />
    </OverlayContainer>
  );
}
