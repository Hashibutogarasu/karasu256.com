'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useIsMobile } from '@Hashibutogarasu/ui';
import { cn } from '@/lib/utils';

interface AccountPortalLinkProps {
  accountsUrl: string;
}

/**
 * Card linking to the Karasu Lab account portal for profile, security, and
 * connected-account management. Stacks vertically on mobile viewports.
 */
export function AccountPortalLink({ accountsUrl }: AccountPortalLinkProps) {
  const t = useTranslations();
  const isMobile = useIsMobile();

  return (
    <div className={cn('rounded-lg border border-border p-4 flex gap-4', isMobile ? 'flex-col items-start' : 'items-center justify-between')}>
      <p className="text-sm text-muted-foreground">{t('settings.profile.accountSettingsDescription')}</p>
      <a href={`${accountsUrl}/settings`} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
        {t('settings.profile.accountSettings')}
        <ArrowRight className="size-4" />
      </a>
    </div>
  );
}
