'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  getTranslationStatistics, 
  getIncompleteTranslations,
  type TranslationWorkflowItem 
} from '@/lib/multilingual-content';
import { TranslationStatusCard } from './translation-status-card';
import { TranslationWorkflowList } from './translation-workflow-list';
import { TranslationFilters } from './translation-filters';

interface TranslationDashboardProps {
  userRole?: 'admin' | 'editor' | 'translator';
}

export function TranslationDashboard({ userRole = 'editor' }: TranslationDashboardProps) {
  const t = useTranslations('translation');
  const [statistics, setStatistics] = useState<any>(null);
  const [workflowItems, setWorkflowItems] = useState<TranslationWorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    documentType: '',
    language: '',
    priority: '',
    status: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, newsItems, pageItems, programItems] = await Promise.all([
        getTranslationStatistics(),
        getIncompleteTranslations('newsEvent', ['title', 'excerpt', 'content']),
        getIncompleteTranslations('page', ['title', 'content']),
        getIncompleteTranslations('academicProgram', ['title', 'description']),
      ]);

      setStatistics(stats);
      setWorkflowItems([...newsItems, ...pageItems, ...programItems]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = workflowItems.filter(item => {
    if (filters.documentType && item.documentType !== filters.documentType) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.language) {
      const languageStatus = item.status[filters.language as 'bengali' | 'english'];
      if (filters.status === 'complete' && languageStatus.isComplete) return true;
      if (filters.status === 'incomplete' && !languageStatus.isComplete) return true;
      if (!filters.status) return true;
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.title', { defaultValue: 'Translation Dashboard' })}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('dashboard.description', { 
            defaultValue: 'Monitor and manage multilingual content translations' 
          })}
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TranslationStatusCard
            title={t('stats.total', { defaultValue: 'Total Tasks' })}
            value={statistics.total}
            color="blue"
          />
          <TranslationStatusCard
            title={t('stats.completed', { defaultValue: 'Completed' })}
            value={statistics.completed}
            color="green"
          />
          <TranslationStatusCard
            title={t('stats.inProgress', { defaultValue: 'In Progress' })}
            value={statistics.inProgress}
            color="yellow"
          />
          <TranslationStatusCard
            title={t('stats.pending', { defaultValue: 'Pending' })}
            value={statistics.pending}
            color="red"
          />
        </div>
      )}

      {/* Language Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('stats.bengali', { defaultValue: 'Bengali Translations' })}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('stats.completed', { defaultValue: 'Completed' })}
                </span>
                <span className="text-sm font-medium text-green-600">
                  {statistics.byLanguage.bengali.completed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('stats.pending', { defaultValue: 'Pending' })}
                </span>
                <span className="text-sm font-medium text-red-600">
                  {statistics.byLanguage.bengali.pending}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('stats.english', { defaultValue: 'English Translations' })}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('stats.completed', { defaultValue: 'Completed' })}
                </span>
                <span className="text-sm font-medium text-green-600">
                  {statistics.byLanguage.english.completed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('stats.pending', { defaultValue: 'Pending' })}
                </span>
                <span className="text-sm font-medium text-red-600">
                  {statistics.byLanguage.english.pending}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <TranslationFilters
        filters={filters}
        onFiltersChange={setFilters}
        documentTypes={['newsEvent', 'page', 'academicProgram', 'staffMember', 'facility']}
      />

      {/* Workflow Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">
            {t('workflow.title', { defaultValue: 'Translation Workflow' })}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('workflow.description', { 
              defaultValue: 'Content items requiring translation attention' 
            })}
          </p>
        </div>

        <TranslationWorkflowList
          items={filteredItems}
          onRefresh={loadDashboardData}
          userRole={userRole}
        />
      </div>
    </div>
  );
}