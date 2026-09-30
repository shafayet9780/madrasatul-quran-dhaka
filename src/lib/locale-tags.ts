import type { Locale } from './i18n';

/** Route segment names are internal identifiers, not HTML language codes. */
export function languageTag(locale: Locale): 'bn' | 'en' {
  return locale === 'bengali' ? 'bn' : 'en';
}
