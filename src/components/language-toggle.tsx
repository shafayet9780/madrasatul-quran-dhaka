'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { locales, type Locale } from '@/lib/i18n';
import { getLanguageLabel as getLanguageLabelUtil } from '@/lib/language-utils';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Remove the current locale from the pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      // Navigate to the new locale
      router.push(`/${newLocale}${pathWithoutLocale}`);
    });
    setIsOpen(false);
  };

  const getLanguageLabel = (lang: Locale) => {
    return getLanguageLabelUtil(lang);
  };

  const getCurrentLanguageLabel = () => getLanguageLabel(locale);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 
          bg-white hover:bg-gray-50 transition-all duration-200 
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        `}
        disabled={isPending}
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {getCurrentLanguageLabel()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div
            className={`
              absolute top-full mt-1 right-0 z-20 min-w-[120px] 
              bg-white border border-gray-200 rounded-lg shadow-lg 
              transform transition-all duration-200 origin-top-right
              ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
            role="listbox"
            aria-label="Language options"
          >
            {locales.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`
                  w-full text-left px-4 py-2 text-sm transition-colors duration-150
                  first:rounded-t-lg last:rounded-b-lg
                  ${
                    lang === locale
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                  focus:outline-none focus:bg-primary-50 focus:text-primary-700
                `}
                role="option"
                aria-selected={lang === locale}
                disabled={isPending}
              >
                {getLanguageLabel(lang)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}