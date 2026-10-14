'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** The same page in the other language. */
export function LanguageSwitch({ locale, label, title, className }: { locale: Locale; label: string; title: string; className?: string }) {
  const pathname = usePathname() || `/${locale}`;
  const other: Locale = locale === 'bengali' ? 'english' : 'bengali';
  const href = pathname.replace(/^\/(bengali|english)(?=\/|$)/, `/${other}`);
  return (
    <Link
      href={href}
      hrefLang={other === 'bengali' ? 'bn' : 'en'}
      lang={other === 'bengali' ? 'bn' : 'en'}
      aria-label={title}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center rounded-full border border-line-strong px-4 text-15 font-semibold text-rust-deep no-underline hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        className,
      )}
    >
      {label}
    </Link>
  );
}
