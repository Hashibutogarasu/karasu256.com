'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { Button, Menu, MenuTrigger, MenuContent, MenuSeparator, SwitchMenuItem } from '@Hashibutogarasu/ui';
import { useAutoRegenerate } from '@/hooks/use-auto-regenerate';
import { IntervalMenu } from './IntervalMenu';

/** The settings icon button that opens the auto-regenerate configuration menu. */
export function QrSettingsMenu() {
  const t = useTranslations('qr');
  const { enabled, intervalSeconds, toggle, setIntervalSeconds } = useAutoRegenerate();

  return (
    <Menu highlightItemOnHover={false}>
      <MenuTrigger render={<Button variant="outline" size="icon" aria-label={t('settingsMenuLabel')} />}>
        <FontAwesomeIcon icon={faGear} />
      </MenuTrigger>
      <MenuContent>
        <SwitchMenuItem checked={enabled} onCheckedChange={toggle} className="hover:bg-accent hover:text-accent-foreground">
          {t('autoRegenerate.label')}
        </SwitchMenuItem>
        <MenuSeparator />
        <IntervalMenu intervalSeconds={intervalSeconds} onSelect={setIntervalSeconds} />
      </MenuContent>
    </Menu>
  );
}
