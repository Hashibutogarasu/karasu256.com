'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';

/**
 * Renders Google and GitHub sign-in buttons. Delegates the OAuth handshake
 * to better-auth; on success the callback signs in to the linked provider's
 * existing user and, via `bridgeFirebaseSessionForSocialSignIn`, hands off
 * to `/auth/callback` to establish the real Firebase session.
 */
export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        onClick={() => {
          void authClient.signIn.social({ provider: 'google', callbackURL: '/settings' });
        }}
      >
        <FontAwesomeIcon icon={faGoogle} />
        Google
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          void authClient.signIn.social({ provider: 'github', callbackURL: '/settings' });
        }}
      >
        <FontAwesomeIcon icon={faGithub} />
        GitHub
      </Button>
    </div>
  );
}
