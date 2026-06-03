'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PeopleHero } from '@/components/people/people-hero';
import { AdvisorCard } from './advisor-card';
import { getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Advisor } from '@/types/sanity';

interface AdvisorsListProps {
  advisors: Advisor[];
  placeholders?: AvatarPlaceholders;
}

export function AdvisorsList({ advisors, placeholders }: AdvisorsListProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('advisors');
  const tp = useTranslations('people');
  const font = getFontClass(locale);
  const sorted = useMemo(
    () => [...advisors].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [advisors]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PeopleHero title={t('title')} subtitle={t('subtitle')} language={locale} />

      <section className="container-custom py-12 md:py-16">
        {advisors.length === 0 ? (
          <p className={`text-center text-gray-500 ${font}`}>{tp('noResults')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((advisor) => (
              <AdvisorCard key={advisor._id} advisor={advisor} placeholders={placeholders} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
