import { type Locale, locales } from './i18n';

/**
 * Detects the preferred language from browser settings
 */
export function detectBrowserLanguage(): Locale {
  if (typeof window === 'undefined') {
    return 'bengali'; // Default for SSR
  }

  const browserLanguages = navigator.languages || [navigator.language];
  
  for (const browserLang of browserLanguages) {
    // Check for exact matches first
    if (browserLang === 'bn' || browserLang === 'bn-BD') {
      return 'bengali';
    }
    if (browserLang === 'en' || browserLang.startsWith('en-')) {
      return 'english';
    }
    
    // Check for partial matches
    const langCode = browserLang.split('-')[0];
    if (langCode === 'bn') {
      return 'bengali';
    }
    if (langCode === 'en') {
      return 'english';
    }
  }
  
  // Default to Bengali for Bangladesh users
  return 'bengali';
}

/**
 * Gets the language label in its native script
 */
export function getLanguageLabel(locale: Locale): string {
  switch (locale) {
    case 'bengali':
      return 'বাংলা';
    case 'english':
      return 'English';
    default:
      return locale;
  }
}

/**
 * Gets the language label in English
 */
export function getLanguageLabelInEnglish(locale: Locale): string {
  switch (locale) {
    case 'bengali':
      return 'Bengali';
    case 'english':
      return 'English';
    default:
      return locale;
  }
}

/**
 * Validates if a locale is supported
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Gets the opposite locale (for quick switching)
 */
export function getAlternateLocale(currentLocale: Locale): Locale {
  return currentLocale === 'bengali' ? 'english' : 'bengali';
}

/**
 * Formats text direction based on locale
 */
export function getTextDirection(_locale: Locale): 'ltr' | 'rtl' {
  // Both Bengali and English are LTR
  // This function is prepared for future RTL language support
  return 'ltr';
}

/**
 * Gets the appropriate font class for a locale
 */
export function getFontClass(locale: Locale): string {
  return `font-${locale}`;
}

/**
 * Stores language preference in localStorage
 */
export function storeLanguagePreference(locale: Locale): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('preferred-language', locale);
    } catch (error) {
      console.warn('Failed to store language preference:', error);
    }
  }
}

/**
 * Retrieves language preference from localStorage
 */
export function getStoredLanguagePreference(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem('preferred-language');
    return stored && isValidLocale(stored) ? stored : null;
  } catch (error) {
    console.warn('Failed to retrieve language preference:', error);
    return null;
  }
}