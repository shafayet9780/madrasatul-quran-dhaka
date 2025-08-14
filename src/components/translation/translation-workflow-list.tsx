'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  NewspaperIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { 
  getLocalizedText,
  createTranslationTask,
  completeTranslation,
  type TranslationWorkflowItem 
} from '@/lib/multilingual-content';

interface TranslationWorkflowListProps {
  items: TranslationWorkflowItem[];
  onRefresh: () => void;
  userRole: 'admin' | 'editor' | 'translator';
}

export function TranslationWorkflowList({ 
  items, 
  onRefresh, 
  userRole 
}: TranslationWorkflowListProps) {
  const t = useTranslations('translation');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'newsEvent':
        return NewspaperIcon;
      case 'page':
        return DocumentTextIcon;
      case 'academicProgram':
        return AcademicCapIcon;
      case 'staffMember':
        return UserGroupIcon;
      case 'facility':
        return BuildingOfficeIcon;
      default:
        return DocumentTextIcon;
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleCreateTask = async (
    documentId: string, 
    language: 'bengali' | 'english'
  ) => {
    if (userRole !== 'admin' && userRole !== 'editor') return;

    setLoading(`${documentId}-${language}`);
    try {
      await createTranslationTask(documentId, language, 'current-user');
      onRefresh();
    } catch (error) {
      console.error('Error creating translation task:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCompleteTranslation = async (
    documentId: string, 
    language: 'bengali' | 'english'
  ) => {
    setLoading(`${documentId}-${language}`);
    try {
      await completeTranslation(documentId, language, 'current-user');
      onRefresh();
    } catch (error) {
      console.error('Error completing translation:', error);
    } finally {
      setLoading(null);
    }
  };

  const toggleItemSelection = (documentId: string) => {
    setSelectedItems(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('workflow.noItems', { defaultValue: 'All translations complete!' })}
        </h3>
        <p className="text-gray-600">
          {t('workflow.noItemsDescription', { 
            defaultValue: 'All content has been translated to both languages.' 
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item) => {
        const Icon = getDocumentTypeIcon(item.documentType);
        const title = getLocalizedText(item.title, 'english') || 
                     getLocalizedText(item.title, 'bengali') || 
                     'Untitled';

        return (
          <div key={item.documentId} className="p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              {/* Selection checkbox */}
              <input
                type="checkbox"
                checked={selectedItems.includes(item.documentId)}
                onChange={() => toggleItemSelection(item.documentId)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />

              {/* Document icon */}
              <div className="flex-shrink-0">
                <Icon className="h-6 w-6 text-gray-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {getDocumentTypeName(item.documentType)}
                    </span>
                  </div>
                  
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getPriorityColor(item.priority)
                  )}>
                    {item.priority}
                  </span>
                </div>

                {/* Translation status */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {/* Bengali status */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {t('languages.bengali', { defaultValue: 'Bengali' })}
                      </span>
                      {item.status.bengali.isComplete ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    
                    {!item.status.bengali.isComplete && (userRole === 'admin' || userRole === 'editor') && (
                      <button
                        onClick={() => handleCreateTask(item.documentId, 'bengali')}
                        disabled={loading === `${item.documentId}-bengali`}
                        className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                      >
                        {loading === `${item.documentId}-bengali` ? (
                          <ClockIcon className="h-3 w-3 animate-spin" />
                        ) : (
                          t('actions.createTask', { defaultValue: 'Create Task' })
                        )}
                      </button>
                    )}
                  </div>

                  {/* English status */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {t('languages.english', { defaultValue: 'English' })}
                      </span>
                      {item.status.english.isComplete ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    
                    {!item.status.english.isComplete && (userRole === 'admin' || userRole === 'editor') && (
                      <button
                        onClick={() => handleCreateTask(item.documentId, 'english')}
                        disabled={loading === `${item.documentId}-english`}
                        className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                      >
                        {loading === `${item.documentId}-english` ? (
                          <ClockIcon className="h-3 w-3 animate-spin" />
                        ) : (
                          t('actions.createTask', { defaultValue: 'Create Task' })
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Missing fields */}
                {(item.status.bengali.missingFields.length > 0 || item.status.english.missingFields.length > 0) && (
                  <div className="mt-2 text-xs text-gray-600">
                    {item.status.bengali.missingFields.length > 0 && (
                      <div>
                        <span className="font-medium">Bengali missing:</span>{' '}
                        {item.status.bengali.missingFields.join(', ')}
                      </div>
                    )}
                    {item.status.english.missingFields.length > 0 && (
                      <div>
                        <span className="font-medium">English missing:</span>{' '}
                        {item.status.english.missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Bulk actions */}
      {selectedItems.length > 0 && (userRole === 'admin' || userRole === 'editor') && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('bulkActions.selected', { 
                count: selectedItems.length,
                defaultValue: `${selectedItems.length} items selected` 
              })}
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Implement bulk create tasks
                  console.log('Bulk create tasks for:', selectedItems);
                }}
                className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                {t('bulkActions.createTasks', { defaultValue: 'Create Tasks' })}
              </button>
              
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {t('bulkActions.clear', { defaultValue: 'Clear Selection' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}