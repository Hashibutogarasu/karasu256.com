'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Separator, SettingsAccordion } from '@Hashibutogarasu/ui';
import { PasswordSection } from '@/components/auth/settings/password-section';
import { PasskeyList } from '@/components/auth/passkey-list';
import { PasskeyCreateDialog } from '@/components/auth/passkey-create-dialog';
import { DangerZone } from '@/components/auth/settings/danger-zone';
import { useSettingsUser } from '@/components/settings/user-context';

export function SecurityClient() {
  const t = useTranslations();
  const { user } = useSettingsUser();
  const [passkeyVersion, setPasskeyVersion] = useState(0);

  return (
    <div className="space-y-6">
      <PasswordSection />
      <Separator />
      <SettingsAccordion
        title={t('passkey.title')}
        action={user.email ? <PasskeyCreateDialog email={user.email} onSuccess={() => setPasskeyVersion((v) => v + 1)} /> : undefined}
      >
        <PasskeyList version={passkeyVersion} />
      </SettingsAccordion>
      <Separator />
      <DangerZone />
    </div>
  );
}
