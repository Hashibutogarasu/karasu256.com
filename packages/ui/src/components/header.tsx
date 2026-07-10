import * as React from 'react';
import { cn } from '../lib/utils';
import { LocaleSwitcher, type LocaleOption } from './locale-switcher';

export interface HeaderProps {
  /** Leading site title/logo slot. */
  logo: React.ReactNode;
  /** Trailing nav content, e.g. an account menu or sign-in button. */
  children?: React.ReactNode;
  className?: string;
  /**
   * Available locales, keyed by locale code with each value the translated
   * display label and flag country code (e.g.
   * `{ ja: { label: '日本語', countryCode: 'JP' } }`). Omit to hide the
   * language switcher entirely.
   */
  locales?: Record<string, Omit<LocaleOption, 'code'>>;
  /** The locale currently in effect. Required to render the switcher. */
  currentLocale?: string;
  /** Invoked with the newly selected locale code. Required to render the switcher. */
  onLocaleChange?: (locale: string) => void | Promise<void>;
  /** aria-label for the language switcher's globe trigger. */
  localeMenuAriaLabel?: string;
}

/**
 * Site-wide sticky header shell shared across apps. Purely presentational —
 * callers fetch their own session data and pass the result in via props.
 * Renders an optional language switcher to the left of `children` when
 * `locales`, `currentLocale`, and `onLocaleChange` are all provided.
 */
export function Header({ logo, children, className, locales, currentLocale, onLocaleChange, localeMenuAriaLabel }: HeaderProps) {
  const localeOptions = locales ? Object.entries(locales).map(([code, option]) => ({ code, ...option })) : null;

  return (
    <header
      className={cn('sticky top-0 z-20 bg-background w-full h-12 px-6 flex justify-between items-center border-b border-border shrink-0', className)}
    >
      <div className="font-bold text-xl">{logo}</div>
      <nav>
        <ul className="flex items-center gap-4">
          {localeOptions && currentLocale && onLocaleChange && (
            <li className="flex items-center">
              <LocaleSwitcher
                locales={localeOptions}
                currentLocale={currentLocale}
                onSelectLocale={onLocaleChange}
                triggerAriaLabel={localeMenuAriaLabel}
              />
            </li>
          )}
          {React.Children.map(children, (child, index) => (
            <li key={index} className="flex items-center">
              {child}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
