'use client';

import { useEffect } from 'react';

interface LocaleProviderProps {
  locale: string;
  children: React.ReactNode;
}

export default function LocaleProvider({ locale, children }: LocaleProviderProps) {
  useEffect(() => {
    // Update document attributes after hydration
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'arabic' ? 'rtl' : 'ltr';
    
    // Add locale-specific font class
    const fontClass = `font-${locale}`;
    document.documentElement.classList.remove('font-bengali', 'font-english', 'font-arabic');
    document.documentElement.classList.add(fontClass);
  }, [locale]);

  return <>{children}</>;
}