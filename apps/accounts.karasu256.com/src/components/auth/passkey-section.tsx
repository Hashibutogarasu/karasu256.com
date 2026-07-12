'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';
import { Button, Spinner } from '@Hashibutogarasu/ui';

export interface PasskeySectionProps {
  /** Called after a successful sign-in, instead of the default redirect to `/settings`. */
  onSuccess?: () => void;
}

/** Renders the passkey sign-in button for unauthenticated users. */
export function PasskeySection({ onSuccess }: PasskeySectionProps = {}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    // WebAuthn cancellation surfaces as a returned `error`, not always via
    // `fetchOptions.onError` (that only fires for server-side failures), so
    // check the return value directly rather than relying on the callback.
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      toast.error(result.error.message ?? t('passkey.error.unknown'));
      setLoading(false);
      return;
    }
    if (onSuccess) onSuccess();
    else router.replace('/settings');
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn} disabled={loading}>
      {loading ? <Spinner /> : <FontAwesomeIcon icon={faFingerprint} />}
      {loading ? t('passkey.waiting') : t('passkey.signIn')}
    </Button>
  );
}
