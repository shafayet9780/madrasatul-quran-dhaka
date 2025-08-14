'use client';

import { useTranslations } from 'next-intl';

interface TranslationFiltersProps {
  filters: {
    documentType: string;
    language: string;
    priority: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  documentTypes: string[];
}

export function TranslationFilters({ 
  filters, 
  onFiltersChange, 
  documentTypes 
}: TranslationFiltersProps) {
  const t = useTranslations('translation');

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      documentType: '',
      language: '',
      priority: '',
      status: '',
    });
  };

  const getDocumentTypeName = (type: string) => {
    const names: Record<string, string> = {
      newsEvent: t('documentTypes.newsEvent', { defaultValue: 'News & Events' }),
      page: t('documentTypes.page', { defaultValue: 'Page' }),
      academicProgram: t('documentTypes.academicProgram', { defaultValue: 'Academic Program' }),
      staffMember: t('documentTypes.staffMember', { defaultValue: 'Staff Member' }),
      facility: t('documentTypes.facility', { defaultValue: 'Facility' }),
    };
    return names[type] || type;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">
          {t('filters.title', { defaultValue: 'Filters' })}
        </h3>
        
        <button
          onClick={clearFilters}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {t('filters.clear', { defaultValue: 'Clear all' })}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Document Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.documentType', { defaultValue: 'Document Type' })}
          </label>
          <select
            value={filters.documentType}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">
              {t('filters.all', { defaultValue: 'All' })}
            </option>
            {documentTypes.map(type => (
              <option key={type} value={type}>
                {getDocumentTypeName(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.language', { defaultValue: 'Language' })}
          </label>
          <select
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">
              {t('filters.all', { defaultValue: 'All' })}
            </option>
            <option value="bengali">
              {t('languages.bengali', { defaultValue: 'Bengali' })}
            </option>
            <option value="english">
              {t('languages.english', { defaultValue: 'English' })}
            </option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.priority', { defaultValue: 'Priority' })}
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">
              {t('filters.all', { defaultValue: 'All' })}
            </option>
            <option value="high">
              {t('priority.high', { defaultValue: 'High' })}
            </option>
            <option value="medium">
              {t('priority.medium', { defaultValue: 'Medium' })}
            </option>
            <option value="low">
              {t('priority.low', { defaultValue: 'Low' })}
            </option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.status', { defaultValue: 'Status' })}
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">
              {t('filters.all', { defaultValue: 'All' })}
            </option>
            <option value="complete">
              {t('status.complete', { defaultValue: 'Complete' })}
            </option>
            <option value="incomplete">
              {t('status.incomplete', { defaultValue: 'Incomplete' })}
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}