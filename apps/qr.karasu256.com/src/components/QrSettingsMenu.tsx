'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { Button, Menu, MenuTrigger, MenuContent, MenuSeparator, MenuSub, MenuSubTrigger, MenuSubContent, SwitchMenuItem } from '@Hashibutogarasu/ui';
import { useAutoRegenerate } from '@/hooks/use-auto-regenerate';
import { IntervalMenu } from './IntervalMenu';

/** The settings icon button that opens the auto-regenerate configuration menu. */
export function QrSettingsMenu() {
  const t = useTranslations('qr');
  const { enabled, intervalSeconds, toggle, setIntervalSeconds } = useAutoRegenerate();

  return (
    <Menu highlightItemOnHover={false}>
      <MenuTrigger render={<Button variant="secondary" size="icon" className="rounded-full" aria-label={t('settingsMenuLabel')} />}>
        <FontAwesomeIcon icon={faGear} />
      </MenuTrigger>
      <MenuContent>
        <SwitchMenuItem checked={enabled} onCheckedChange={toggle}>
          {t('autoRegenerate.label')}
        </SwitchMenuItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger openOnHover={false}>{t('interval.label')}</MenuSubTrigger>
          <MenuSubContent>
            <IntervalMenu intervalSeconds={intervalSeconds} onSelect={setIntervalSeconds} />
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  );
}
