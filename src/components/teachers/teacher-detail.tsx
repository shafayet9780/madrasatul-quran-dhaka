'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RichText } from '@/components/ui/rich-text';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import {
  ProfileBreadcrumb,
  SectionHeading,
  Qualifications,
  EducationSection,
  TagList,
} from '@/components/people/profile-sections';
import { getLocalizedText, getLocalizedArray, getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Teacher } from '@/types/sanity';

interface TeacherDetailProps {
  teacher: Teacher;
  placeholders?: AvatarPlaceholders;
}

export function TeacherDetail({ teacher, placeholders }: TeacherDetailProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('people');
  const tt = useTranslations('teachers');
  const font = getFontClass(locale);
  const name = getLocalizedText(teacher.name, locale);
  const bio = teacher.fullBio?.[locale];
  const subjects = getLocalizedArray(teacher.subjects, locale);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container-custom py-4">
          <ProfileBreadcrumb language={locale} parentHref="/teachers" parentLabel={tt('title')} current={name} />
        </div>
      </div>

      <div className="container-custom grid gap-8 py-10 lg:grid-cols-[320px_1fr] md:py-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-gray-100">
            <ProfileAvatar
              photo={teacher.photo}
              gender={teacher.gender}
              placeholders={placeholders}
              name={name}
              className="mx-auto h-36 w-36 ring-4 ring-primary-100"
            />
            <h1 className={`mt-5 text-2xl font-bold text-gray-900 ${font}`}>{name}</h1>
            {teacher.designation && (
              <p className={`mt-1 text-primary-600 ${font}`}>{getLocalizedText(teacher.designation, locale)}</p>
            )}
            {teacher.department && (
              <p className={`mt-1 text-sm text-gray-500 ${font}`}>
                {getLocalizedText(teacher.department.name, locale)}
              </p>
            )}
            {typeof teacher.yearsOfExperience === 'number' && (
              <div className="mt-5 rounded-xl bg-primary-50 px-4 py-3">
                <span className="block text-2xl font-bold text-primary-700">{teacher.yearsOfExperience}+</span>
                <span className={`text-xs text-primary-600 ${font}`}>{t('experience')}</span>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-10">
          {bio && bio.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <SectionHeading language={locale}>{t('biography')}</SectionHeading>
              <RichText content={bio} language={locale} />
            </section>
          )}

          {subjects.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <TagList items={subjects} label={t('subjects')} language={locale} />
            </section>
          )}

          {(teacher.qualifications || teacher.education) && (
            <section className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2 md:p-8">
              <Qualifications items={teacher.qualifications} language={locale} />
              <EducationSection items={teacher.education} language={locale} />
            </section>
          )}

          {teacher.specializations && teacher.specializations.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <TagList items={teacher.specializations} label={t('specializations')} language={locale} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
