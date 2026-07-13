'use client';

import { useState } from 'react';
import { signInWithCustomToken, type Auth, type User } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { authenticateWithPasskey } from '@/lib/api/passkey-authenticate';
import { PasskeyError } from '@/lib/api/passkey-errors';
import { Button, Spinner } from '@Hashibutogarasu/ui';

export interface PasskeySectionProps {
  /** Firebase Auth instance to authenticate against. Defaults to the app's primary instance. */
  auth?: Auth;
  /** Called after a successful sign-in, in addition to the default `onAuthStateChanged`-driven flow. */
  onSuccess?: (user: User) => void;
}

/**
 * Renders the passkey sign-in button for unauthenticated users.
 *
 * Uses a discoverable credential lookup so no email is required.
 * Delegates the WebAuthn + server round-trips to {@link authenticateWithPasskey}.
 */
export function PasskeySection({ auth, onSuccess }: PasskeySectionProps = {}) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      const customToken = await authenticateWithPasskey();
      const credential = await signInWithCustomToken(auth ?? getFirebaseAuth(), customToken);
      onSuccess?.(credential.user);
    } catch (err) {
      const key = err instanceof PasskeyError ? err.i18nKey : 'passkey.error.unknown';
      toast.error(t(key));
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn} disabled={loading}>
      {loading ? <Spinner /> : <FontAwesomeIcon icon={faFingerprint} />}
      {loading ? t('passkey.waiting') : t('passkey.signIn')}
    </Button>
  );
}
