'use client';

import { useLocale } from 'next-intl';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import { getLocalizedText, getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Advisor } from '@/types/sanity';

interface AdvisorCardProps {
  advisor: Advisor;
  placeholders?: AvatarPlaceholders;
}

/** Advisors have no detail page — this is always a plain (non-link) card. */
export function AdvisorCard({ advisor, placeholders }: AdvisorCardProps) {
  const locale = useLocale() as Language;
  const font = getFontClass(locale);
  const name = getLocalizedText(advisor.name, locale);
  const summary = getLocalizedText(advisor.summary, locale);

  return (
    <div className="flex flex-col items-center rounded-2xl border-t-2 border-transparent bg-white p-8 text-center shadow-md ring-1 ring-gray-100">
      <ProfileAvatar
        photo={advisor.photo}
        gender={advisor.gender}
        placeholders={placeholders}
        name={name}
        className="h-28 w-28 ring-4 ring-primary-100"
      />
      <h3 className={`mt-5 text-xl font-bold text-gray-900 ${font}`}>{name}</h3>
      {summary && (
        <p className={`mt-3 text-sm text-gray-500 ${font}`}>{summary}</p>
      )}
    </div>
  );
}
