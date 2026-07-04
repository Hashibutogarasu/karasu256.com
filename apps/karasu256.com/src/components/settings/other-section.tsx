'use client';

import { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, Button, ConfirmDialog, R2Image, SettingsAccordion, SettingsItem } from '@Hashibutogarasu/ui';
import { listAuthorizedApps, revokeAuthorizedApp, type AuthorizedAppSummary } from '@/lib/api/other';

/**
 * Other settings section. Currently contains the authorized apps list, where
 * users can view and revoke OAuth clients they have previously consented to.
 */
export function OtherSection() {
  const t = useTranslations();

  const [apps, setApps] = useState<AuthorizedAppSummary[]>([]);
  const [pendingRevoke, setPendingRevoke] = useState<AuthorizedAppSummary | null>(null);

  useEffect(() => {
    void listAuthorizedApps().then(setApps);
  }, []);

  async function confirmRevoke() {
    if (!pendingRevoke) return;
    await revokeAuthorizedApp(pendingRevoke.id);
    setApps((prev) => prev.filter((a) => a.id !== pendingRevoke.id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('settings.other.title')}</h1>

      <SettingsAccordion title={t('settings.other.authorizedApps')}>
        <div className="mt-2 space-y-2">
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t('settings.other.noAuthorizedApps')}</p>
          ) : (
            apps.map((app) => <AuthorizedAppRow key={app.id} app={app} onRevoke={() => setPendingRevoke(app)} />)
          )}
        </div>
      </SettingsAccordion>

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
        title={t('settings.other.revokeConfirm.title')}
        description={t('settings.other.revokeConfirm.description', {
          name: pendingRevoke?.name ?? '',
        })}
        confirmLabel={t('settings.other.revoke')}
        cancelLabel={t('settings.other.revokeConfirm.cancel')}
        onConfirm={confirmRevoke}
      />
    </div>
  );
}

interface AuthorizedAppRowProps {
  app: AuthorizedAppSummary;
  onRevoke: () => void;
}

function AuthorizedAppRow({ app, onRevoke }: AuthorizedAppRowProps) {
  const t = useTranslations();

  return (
    <SettingsItem className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {app.iconUrl && <R2Image src={app.iconUrl} alt="" width={32} height={32} className="rounded size-8 shrink-0 object-cover" />}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium truncate">{app.name}</p>
          <div className="flex flex-wrap gap-1">
            {app.scopes.map((scope) => (
              <Badge key={scope} variant="secondary" className="text-xs">
                {scope}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" onClick={onRevoke}>
        <Ban className="size-4" />
        {t('settings.other.revoke')}
      </Button>
    </SettingsItem>
  );
}
