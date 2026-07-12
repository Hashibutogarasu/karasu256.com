'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, Separator, toast } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';
import { EmailPasswordForm } from '@/components/auth/email-password-form';
import { PasskeySection } from '@/components/auth/passkey-section';

export interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after an account is successfully added, so the caller can refresh its account list. */
  onAdded?: () => void;
}

/**
 * Dialog for signing in to a second (or further) account without disturbing
 * the currently active session.
 *
 * better-auth's `multiSession` plugin already keeps every sign-in as an
 * additional device session (via a `_multi-<token>` cookie) instead of
 * replacing existing ones — a new sign-in just becomes the *active* one. So
 * this reuses the ordinary sign-in forms as-is, remembers which session was
 * active before the dialog opened, and switches back to it via
 * `authClient.multiSession.setActive()` once the new sign-in completes.
 */
export function AddAccountDialog({ open, onOpenChange, onAdded }: AddAccountDialogProps) {
  const t = useTranslations();
  const previousSessionToken = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    authClient.getSession().then(({ data }) => {
      previousSessionToken.current = data?.session.token ?? null;
    });
  }, [open]);

  async function handleSignedIn() {
    try {
      if (previousSessionToken.current) {
        await authClient.multiSession.setActive({ sessionToken: previousSessionToken.current });
      }
      onOpenChange(false);
      onAdded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>{t('settings.accountSwitcher.addAccount')}</DialogTitle>
          <EmailPasswordForm onSuccess={handleSignedIn} />
          <Separator className="my-4" />
          <PasskeySection onSuccess={handleSignedIn} />
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
