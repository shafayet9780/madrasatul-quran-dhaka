'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { PeopleHero } from '@/components/people/people-hero';
import { TeacherCard } from './teacher-card';
import { TeacherFilterBar } from './teacher-filter-bar';
import { getDepartments, filterTeachers, groupByDepartment } from '@/lib/teacher-grouping';
import { sortBySeniority } from '@/lib/seniority';
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
    return groupByDepartment(filtered).map((g) => ({ ...g, teachers: sortBySeniority(g.teachers) }));
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
          <div className="space-y-14">
            {groups.map((group, i) => {
              const accent = group.department?.accentColor;
              return (
                <div key={group.department?._id ?? `unassigned-${i}`}>
                  {group.department && (
                    <div className="mb-8">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-6 w-1.5 rounded-full"
                          style={{ backgroundColor: accent || 'var(--color-primary-500)' }}
                        />
                        <h2 className={`text-2xl font-semibold text-gray-800 ${font}`}>
                          {getLocalizedText(group.department.name, locale)}
                        </h2>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-500">
                          {group.teachers.length}
                        </span>
                      </div>
                      <div className="mt-3 h-px w-full bg-gradient-to-r from-gray-200 to-transparent" />
                    </div>
                  )}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.teachers.map((teacher) => (
                      <TeacherCard key={teacher._id} teacher={teacher} placeholders={placeholders} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
