'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PeopleHero } from '@/components/people/people-hero';
import { DirectorCard } from './director-card';
import { getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Director } from '@/types/sanity';

interface DirectorsListProps {
  directors: Director[];
  placeholders?: AvatarPlaceholders;
}

export function DirectorsList({ directors, placeholders }: DirectorsListProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('directors');
  const tp = useTranslations('people');
  const font = getFontClass(locale);
  const sorted = useMemo(
    () => [...directors].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [directors]
  );
  const primaryDirector = sorted[0];
  const remainingDirectors = sorted.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <PeopleHero title={t('title')} subtitle={t('subtitle')} language={locale} />

      <section className="container-custom py-12 md:py-16">
        {directors.length === 0 ? (
          <p className={`text-center text-gray-500 ${font}`}>{tp('noResults')}</p>
        ) : (
          <>
            <div className="mx-auto w-full sm:max-w-xs">
              <DirectorCard director={primaryDirector} placeholders={placeholders} />
            </div>

            {remainingDirectors.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {remainingDirectors.map((director) => (
                  <DirectorCard key={director._id} director={director} placeholders={placeholders} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
