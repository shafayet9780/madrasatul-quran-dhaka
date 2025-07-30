'use client';

import { useEffect } from 'react';
import { type Locale } from '@/lib/i18n';
import { getTextDirection, getFontClass, storeLanguagePreference } from '@/lib/language-utils';

interface LocaleProviderProps {
  locale: string;
  children: React.ReactNode;
}

export default function LocaleProvider({ locale, children }: LocaleProviderProps) {
  useEffect(() => {
    const typedLocale = locale as Locale;
    
    // Update document attributes after hydration
    document.documentElement.lang = locale;
    document.documentElement.dir = getTextDirection(typedLocale);
    
    // Add locale-specific font class
    const fontClass = getFontClass(typedLocale);
    document.documentElement.classList.remove('font-bengali', 'font-english');
    document.documentElement.classList.add(fontClass);
    
    // Store language preference
    storeLanguagePreference(typedLocale);
  }, [locale]);

  return <>{children}</>;
}