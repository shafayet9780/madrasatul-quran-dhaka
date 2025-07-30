'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { type Locale } from '@/lib/i18n';

export function useLanguage() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Remove the current locale from the pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      // Navigate to the new locale
      router.push(`/${newLocale}${pathWithoutLocale}`);
    });
  };

  const isCurrentLanguage = (lang: Locale) => lang === locale;

  return {
    currentLocale: locale,
    changeLanguage,
    isCurrentLanguage,
    isPending,
  };
}