'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import { ProfileBadge } from '@/components/people/profile-sections';
import { seniorityBadgeKey } from '@/lib/seniority';
import {
  getLocalizedText,
  getLocalizedSlug,
  getLocalizedArray,
  getFontClass,
  type Language,
} from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Director } from '@/types/sanity';

interface DirectorCardProps {
  director: Director;
  placeholders?: AvatarPlaceholders;
}

export function DirectorCard({ director, placeholders }: DirectorCardProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('people');
  const tSeniority = useTranslations('seniority');
  const font = getFontClass(locale);
  const slug = getLocalizedSlug(director.slug, locale);
  const name = getLocalizedText(director.name, locale);
  const firstQualification = getLocalizedArray(director.qualifications, locale)[0];
  const showSeniority = seniorityBadgeKey(director.seniority);
  const detailEnabled = director.showDetailPage !== false;

  const inner = (
    <>
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

      {(showSeniority || firstQualification) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {showSeniority && (
            <ProfileBadge variant="accent" language={locale}>
              {tSeniority(director.seniority!)}
            </ProfileBadge>
          )}
          {firstQualification && (
            <ProfileBadge variant="muted" language={locale}>
              {firstQualification}
            </ProfileBadge>
          )}
        </div>
      )}

      {director.summary && getLocalizedText(director.summary, locale) && (
        <p className={`mt-3 line-clamp-2 text-sm text-gray-500 ${font}`}>
          {getLocalizedText(director.summary, locale)}
        </p>
      )}
      {detailEnabled && (
        <span className={`mt-4 text-sm font-medium text-accent-600 group-hover:text-accent-700 ${font}`}>
          {t('viewProfile')} →
        </span>
      )}
    </>
  );

  if (!detailEnabled) {
    return (
      <div className="flex flex-col items-center rounded-2xl border-t-2 border-transparent bg-white p-8 text-center shadow-md ring-1 ring-gray-100">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/directors/${slug}`}
      className="group flex flex-col items-center rounded-2xl border-t-2 border-transparent bg-white p-8 text-center shadow-md ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:border-accent-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {inner}
    </Link>
  );
}
