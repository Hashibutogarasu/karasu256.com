'use client';

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
   * Server action invoked with the newly selected locale code, e.g. one
   * that sets a cookie. Bound per-option and submitted via a real `<form>`
   * so Next.js re-renders the page with the new locale on completion — no
   * manual reload needed.
   */
  onSelectLocale: (locale: string) => void | Promise<void>;
  /** Defaults to `"Language"` — override only if a caller needs it translated. */
  triggerAriaLabel?: string;
}

/**
 * Globe-icon trigger that opens a `NavigationMenu` listing the available
 * locales. Purely presentational — callers own persistence via
 * `onSelectLocale`.
 */
export function LocaleSwitcher({ locales, currentLocale, onSelectLocale, triggerAriaLabel = 'Language' }: LocaleSwitcherProps) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger aria-label={triggerAriaLabel}>
            <CiGlobe className="size-5" aria-hidden="true" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-36 flex-col gap-0.5 p-1">
              {locales.map((locale) => (
                <li key={locale.code}>
                  <form action={onSelectLocale.bind(null, locale.code)}>
                    <button
                      type="submit"
                      disabled={locale.code === currentLocale}
                      aria-current={locale.code === currentLocale ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus:bg-muted disabled:cursor-default',
                        locale.code === currentLocale && 'font-semibold text-foreground'
                      )}
                    >
                      {locale.label}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
