import { OverlayContainer } from './overlay-container';
import { LoadingView } from './loading-view';

export interface SwitchingAccountOverlayProps {
  /** The status message to display while the account switch is in progress. */
  message: string;
}

/**
 * Full-screen overlay shown while the active account is being switched,
 * reusing the same card container as the sign-out screen's `LoadingView`.
 */
export function SwitchingAccountOverlay({ message }: SwitchingAccountOverlayProps) {
  return (
    <OverlayContainer>
      <LoadingView message={message} />
    </OverlayContainer>
  );
}
