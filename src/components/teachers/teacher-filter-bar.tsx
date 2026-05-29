'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getLocalizedText, getFontClass, type Language } from '@/lib/sanity-utils';
import type { Department } from '@/types/sanity';

interface TeacherFilterBarProps {
  departments: Department[];
  query: string;
  onQueryChange: (value: string) => void;
  activeDepartment: string | null;
  onDepartmentChange: (id: string | null) => void;
  language: Language;
}

export function TeacherFilterBar({
  departments,
  query,
  onQueryChange,
  activeDepartment,
  onDepartmentChange,
  language,
}: TeacherFilterBarProps) {
  const t = useTranslations('people');
  const font = getFontClass(language);

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${font} ${
      active ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-primary-50'
    }`;

  return (
    <div className="mb-10 space-y-5">
      <div className="relative mx-auto max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className={`w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 ${font}`}
        />
      </div>

      {departments.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => onDepartmentChange(null)} className={chip(activeDepartment === null)}>
            {t('allDepartments')}
          </button>
          {departments.map((dept) => (
            <button
              key={dept._id}
              type="button"
              onClick={() => onDepartmentChange(dept._id)}
              className={chip(activeDepartment === dept._id)}
            >
              {getLocalizedText(dept.name, language)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
