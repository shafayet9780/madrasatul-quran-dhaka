'use client';

import { useTranslations } from 'next-intl';

interface NewsFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function NewsFilters({ selectedCategory, onCategoryChange }: NewsFiltersProps) {
  const t = useTranslations('news.filters');

  const categories = [
    { value: 'all', label: t('all') },
    { value: 'achievement', label: t('achievements') },
    { value: 'news', label: t('news') },
    { value: 'event', label: t('events') },
    { value: 'announcement', label: t('announcements') },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-700 self-center mr-2">
        {t('filterBy')}:
      </span>
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}