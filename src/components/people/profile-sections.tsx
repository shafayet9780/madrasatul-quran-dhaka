'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getLocalizedText, getLocalizedArray, getFontClass, type Language } from '@/lib/sanity-utils';
import type { Education } from '@/types/sanity';

export function ProfileBreadcrumb({
  language,
  parentHref,
  parentLabel,
  current,
}: {
  language: Language;
  parentHref: string;
  parentLabel: string;
  current: string;
}) {
  const font = getFontClass(language);
  const t = useTranslations('people');
  const link = 'text-gray-500 transition-colors hover:text-accent-600';
  return (
    <nav className={`flex items-center gap-1.5 text-sm ${font}`} aria-label="Breadcrumb">
      <Link href="/" className={link}>
        {t('home')}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" aria-hidden />
      <Link href={parentHref} className={link}>
        {parentLabel}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" aria-hidden />
      <span className="truncate font-semibold text-gray-900" aria-current="page">
        {current}
      </span>
    </nav>
  );
}

export function ProfileBadge({
  children,
  variant = 'muted',
  language,
}: {
  children: React.ReactNode;
  variant?: 'accent' | 'muted';
  language: Language;
}) {
  const styles =
    variant === 'accent'
      ? 'bg-accent-50 text-accent-700 ring-accent-200'
      : 'bg-primary-50 text-primary-700 ring-primary-100';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles} ${getFontClass(language)}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({ children, language }: { children: React.ReactNode; language: Language }) {
  return (
    <h2 className={`mb-4 text-xl font-bold text-gray-900 ${getFontClass(language)}`}>{children}</h2>
  );
}

export function Qualifications({
  items,
  language,
}: {
  items?: { bengali: string[]; english: string[] };
  language: Language;
}) {
  const t = useTranslations('people');
  const list = getLocalizedArray(items, language);
  if (list.length === 0) return null;
  const font = getFontClass(language);
  return (
    <div>
      <SectionHeading language={language}>{t('qualifications')}</SectionHeading>
      <ul className="space-y-2">
        {list.map((q, i) => (
          <li key={i} className={`flex items-start text-gray-700 ${font}`}>
            <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EducationSection({ items, language }: { items?: Education[]; language: Language }) {
  const t = useTranslations('people');
  if (!items || items.length === 0) return null;
  const font = getFontClass(language);
  return (
    <div>
      <SectionHeading language={language}>{t('education')}</SectionHeading>
      <div className="space-y-3">
        {items.map((edu, i) => (
          <div key={i} className="rounded-lg bg-gray-50 p-4">
            {edu.degree && (
              <p className={`font-medium text-gray-900 ${font}`}>{getLocalizedText(edu.degree, language)}</p>
            )}
            {edu.institution && (
              <p className={`text-sm text-gray-600 ${font}`}>{getLocalizedText(edu.institution, language)}</p>
            )}
            {edu.year && <p className="text-sm text-gray-500">{edu.year}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TagList({ items, label, language }: { items?: string[]; label: string; language: Language }) {
  if (!items || items.length === 0) return null;
  const font = getFontClass(language);
  return (
    <div>
      <SectionHeading language={language}>{label}</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 ${font}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
