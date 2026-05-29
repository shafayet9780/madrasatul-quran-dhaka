'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { PeopleHero } from '@/components/people/people-hero';
import { TeacherCard } from './teacher-card';
import { TeacherFilterBar } from './teacher-filter-bar';
import { getDepartments, filterTeachers, groupByDepartment } from '@/lib/teacher-grouping';
import { getLocalizedText, getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Teacher } from '@/types/sanity';

interface TeachersListProps {
  teachers: Teacher[];
  placeholders?: AvatarPlaceholders;
}

export function TeachersList({ teachers, placeholders }: TeachersListProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('teachers');
  const tp = useTranslations('people');
  const font = getFontClass(locale);

  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

  const departments = useMemo(() => getDepartments(teachers), [teachers]);

  // Preselect department from a `?department=<slug>` deep link (e.g. from the nav mega-menu).
  useEffect(() => {
    const slug = searchParams.get('department');
    if (!slug) return;
    const match = departments.find(
      (d) => d.slug?.bengali?.current === slug || d.slug?.english?.current === slug
    );
    if (match) setActiveDepartment(match._id);
  }, [searchParams, departments]);
  const groups = useMemo(() => {
    const filtered = filterTeachers(teachers, { query, departmentId: activeDepartment, language: locale });
    return groupByDepartment(filtered);
  }, [teachers, query, activeDepartment, locale]);

  return (
    <div className="min-h-screen bg-gray-50">
      <PeopleHero title={t('title')} subtitle={t('subtitle')} language={locale} />

      <section className="container-custom py-12 md:py-16">
        <TeacherFilterBar
          departments={departments}
          query={query}
          onQueryChange={setQuery}
          activeDepartment={activeDepartment}
          onDepartmentChange={setActiveDepartment}
          language={locale}
        />

        {groups.length === 0 ? (
          <p className={`text-center text-gray-500 ${font}`}>{tp('noResults')}</p>
        ) : (
          <div className="space-y-12">
            {groups.map((group, i) => (
              <div key={group.department?._id ?? `unassigned-${i}`}>
                {group.department && (
                  <h2 className={`mb-6 text-center text-2xl font-semibold text-gray-800 ${font}`}>
                    {getLocalizedText(group.department.name, locale)}
                  </h2>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.teachers.map((teacher) => (
                    <TeacherCard key={teacher._id} teacher={teacher} placeholders={placeholders} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
