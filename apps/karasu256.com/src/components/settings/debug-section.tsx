'use client';

import { useTranslations } from 'next-intl';
import { Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@Hashibutogarasu/ui';
import { useFeatureFlags } from '@Hashibutogarasu/flags/client';
import { appFlagsSchema } from '@/lib/flags';

/** Debug settings section — displays the live value of this app's demo feature flags. */
export function DebugSection() {
  const t = useTranslations();
  const flags = useFeatureFlags<typeof appFlagsSchema>();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('settings.debug.title')}</h1>

      {flags === null ? (
        <p className="text-muted-foreground">{t('settings.debug.unavailable')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('settings.debug.flagName')}</TableHead>
              <TableHead>{t('settings.debug.flagValue')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(flags).map(([name, value]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>
                  <Switch checked={Boolean(value)} disabled />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
