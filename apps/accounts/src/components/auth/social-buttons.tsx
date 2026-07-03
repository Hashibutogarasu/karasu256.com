'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@Hashibutogarasu/ui';

/**
 * Renders Google and GitHub OAuth sign-in buttons that navigate to the
 * server-side OAuth initiation route, which delegates the full OAuth flow to
 * NextAuth and issues a Firebase custom token on completion.
 */
export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        onClick={() => {
          window.location.href = '/api/auth/oauth-signin/google';
        }}
      >
        <FontAwesomeIcon icon={faGoogle} />
        Google
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          window.location.href = '/api/auth/oauth-signin/github';
        }}
      >
        <FontAwesomeIcon icon={faGithub} />
        GitHub
      </Button>
    </div>
  );
}
