'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import {
  getLocalizedText,
  getLocalizedSlug,
  getLocalizedArray,
  getFontClass,
  type Language,
} from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Teacher } from '@/types/sanity';

interface TeacherCardProps {
  teacher: Teacher;
  placeholders?: AvatarPlaceholders;
}

export function TeacherCard({ teacher, placeholders }: TeacherCardProps) {
  const locale = useLocale() as Language;
  const font = getFontClass(locale);
  const slug = getLocalizedSlug(teacher.slug, locale);
  const name = getLocalizedText(teacher.name, locale);
  const subjects = getLocalizedArray(teacher.subjects, locale);

  return (
    <Link
      href={`/teachers/${slug}`}
      className="group flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <ProfileAvatar
        photo={teacher.photo}
        gender={teacher.gender}
        placeholders={placeholders}
        name={name}
        className="h-24 w-24 ring-4 ring-primary-50 transition-all duration-300 group-hover:ring-primary-100"
      />
      <h3 className={`mt-4 text-base font-semibold text-gray-900 ${font}`}>{name}</h3>
      {teacher.designation && getLocalizedText(teacher.designation, locale) && (
        <p className={`mt-0.5 text-sm text-primary-600 ${font}`}>
          {getLocalizedText(teacher.designation, locale)}
        </p>
      )}
      {subjects.length > 0 && (
        <p className={`mt-2 line-clamp-1 text-xs text-gray-500 ${font}`}>{subjects.join(' • ')}</p>
      )}
    </Link>
  );
}
