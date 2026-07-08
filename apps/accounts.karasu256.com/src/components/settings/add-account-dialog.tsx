'use client';

import type { User } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { Dialog, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, Separator, toast } from '@Hashibutogarasu/ui';
import { getSecondaryFirebaseAuth } from '@/lib/firebase/secondary-auth';
import { addAccount } from '@/lib/api/accounts';
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
 * the currently active session. Renders the existing email/password and
 * passkey sign-in forms against a secondary, in-memory-only Firebase Auth
 * instance (see `secondary-auth.ts`), then bridges the resulting account
 * into this device's `multiSession` list via `POST /api/auth/accounts/add`.
 *
 * Social sign-in is intentionally not offered here — the existing
 * Google/GitHub flow is a full-page redirect through better-auth's OAuth
 * handshake and would disturb the current tab's session.
 */
export function AddAccountDialog({ open, onOpenChange, onAdded }: AddAccountDialogProps) {
  const t = useTranslations();

  async function handleSignedIn(user: User) {
    try {
      const idToken = await user.getIdToken();
      await addAccount(idToken);
      onOpenChange(false);
      onAdded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      await getSecondaryFirebaseAuth().signOut();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>{t('settings.accountSwitcher.addAccount')}</DialogTitle>
          <EmailPasswordForm auth={getSecondaryFirebaseAuth()} onSuccess={handleSignedIn} />
          <Separator className="my-4" />
          <PasskeySection auth={getSecondaryFirebaseAuth()} onSuccess={handleSignedIn} />
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
