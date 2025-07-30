'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { type Locale } from '@/lib/i18n';

interface LanguageContextType {
  currentLocale: Locale;
  isRTL: boolean;
  fontClass: string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageContextProviderProps {
  children: React.ReactNode;
}

export function LanguageContextProvider({ children }: LanguageContextProviderProps) {
  const locale = useLocale() as Locale;
  const [mounted, setMounted] = useState(false);

  // Determine if the language is RTL (for Arabic text within content)
  const isRTL = false; // Bengali and English are both LTR
  const direction = isRTL ? 'rtl' : 'ltr';
  
  // Determine font class based on locale
  const fontClass = `font-${locale}`;

  useEffect(() => {
    setMounted(true);
    
    // Update document attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      
      // Update font classes
      document.documentElement.classList.remove('font-bengali', 'font-english');
      document.documentElement.classList.add(fontClass);
    }
  }, [locale, direction, fontClass]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  const value: LanguageContextType = {
    currentLocale: locale,
    isRTL,
    fontClass,
    direction,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageContextProvider');
  }
  return context;
}