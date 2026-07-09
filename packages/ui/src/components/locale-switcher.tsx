'use client';

import * as React from 'react';
import { CiGlobe } from 'react-icons/ci';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from './ui/navigation-menu';
import { cn } from '../lib/utils';

/** A single selectable locale in a {@link LocaleSwitcher}. */
export interface LocaleOption {
  /** BCP-47-ish locale code, e.g. `"ja"`, `"en"`, `"cn"`. */
  code: string;
  /** Human-readable label shown in the language's own script, e.g. `"日本語"`. */
  label: string;
}

export interface LocaleSwitcherProps {
  /** All locales the caller supports. */
  locales: LocaleOption[];
  /** The locale currently in effect. */
  currentLocale: string;
  /**
   * Invoked with the newly selected locale code. Callers are expected to
   * persist it (e.g. via a server action that sets a cookie) — this
   * component does not touch storage itself.
   */
  onSelectLocale: (locale: string) => void | Promise<void>;
  /** Defaults to `"Language"` — override only if a caller needs it translated. */
  triggerAriaLabel?: string;
}

/**
 * Globe-icon trigger that opens a `NavigationMenu` listing the available
 * locales. Purely presentational — callers own persistence and are
 * responsible for reloading/re-rendering after `onSelectLocale` resolves.
 */
export function LocaleSwitcher({ locales, currentLocale, onSelectLocale, triggerAriaLabel = 'Language' }: LocaleSwitcherProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleSelect = (code: string) => {
    if (code === currentLocale || isPending) {
      return;
    }

    startTransition(async () => {
      await onSelectLocale(code);
      window.location.reload();
    });
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger aria-label={triggerAriaLabel} aria-busy={isPending}>
            <CiGlobe className="size-5" aria-hidden="true" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-36 flex-col gap-0.5 p-1">
              {locales.map((locale) => (
                <li key={locale.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(locale.code)}
                    aria-current={locale.code === currentLocale ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus:bg-muted',
                      locale.code === currentLocale && 'font-semibold text-foreground'
                    )}
                  >
                    {locale.label}
                  </button>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
