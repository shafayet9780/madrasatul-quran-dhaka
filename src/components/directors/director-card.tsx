'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import { getLocalizedText, getLocalizedSlug, getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Director } from '@/types/sanity';

interface DirectorCardProps {
  director: Director;
  placeholders?: AvatarPlaceholders;
}

export function DirectorCard({ director, placeholders }: DirectorCardProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('people');
  const font = getFontClass(locale);
  const slug = getLocalizedSlug(director.slug, locale);
  const name = getLocalizedText(director.name, locale);

  return (
    <Link
      href={`/directors/${slug}`}
      className="group flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <ProfileAvatar
        photo={director.photo}
        gender={director.gender}
        placeholders={placeholders}
        name={name}
        className="h-28 w-28 ring-4 ring-primary-100 transition-all duration-300 group-hover:ring-accent-200"
      />
      <h3 className={`mt-5 text-xl font-bold text-gray-900 ${font}`}>{name}</h3>
      <p className={`mt-1 text-sm font-medium text-primary-600 ${font}`}>
        {getLocalizedText(director.designation, locale)}
      </p>
      {director.summary && getLocalizedText(director.summary, locale) && (
        <p className={`mt-3 line-clamp-2 text-sm text-gray-500 ${font}`}>
          {getLocalizedText(director.summary, locale)}
        </p>
      )}
      <span className={`mt-4 text-sm font-medium text-accent-600 group-hover:text-accent-700 ${font}`}>
        {t('viewProfile')} →
      </span>
    </Link>
  );
}
