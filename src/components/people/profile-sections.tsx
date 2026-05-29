'use client';

import Link from 'next/link';
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
  return (
    <nav className={`flex items-center gap-2 text-sm text-gray-500 ${font}`} aria-label="Breadcrumb">
      <Link href="/" className="hover:text-primary-600">
        {t('home')}
      </Link>
      <span aria-hidden>/</span>
      <Link href={parentHref} className="hover:text-primary-600">
        {parentLabel}
      </Link>
      <span aria-hidden>/</span>
      <span className="truncate font-medium text-gray-900">{current}</span>
    </nav>
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
