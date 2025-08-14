import { client } from './sanity';
import type { MultilingualText, MultilingualSlug, MultilingualContent } from '@/types/sanity';

/**
 * Multilingual content management utilities
 */

export type Language = 'bengali' | 'english';

export interface TranslationStatus {
  language: Language;
  isComplete: boolean;
  missingFields: string[];
  lastUpdated?: string;
  wordCount: number;
}

export interface TranslationWorkflowItem {
  documentId: string;
  documentType: string;
  title: MultilingualText;
  status: {
    bengali: TranslationStatus;
    english: TranslationStatus;
  };
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  dueDate?: string;
}

/**
 * Get text content from multilingual field
 */
export function getLocalizedText(
  text: MultilingualText | undefined,
  language: Language,
  fallback?: string
): string {
  if (!text) return fallback || '';
  return text[language] || text[language === 'bengali' ? 'english' : 'bengali'] || fallback || '';
}

/**
 * Get slug from multilingual slug field
 */
export function getLocalizedSlug(
  slug: MultilingualSlug | undefined,
  language: Language
): string {
  if (!slug) return '';
  return slug[language]?.current || slug[language === 'bengali' ? 'english' : 'bengali']?.current || '';
}

/**
 * Check if multilingual text is complete
 */
export function isMultilingualTextComplete(text: MultilingualText | undefined): boolean {
  if (!text) return false;
  return !!(text.bengali && text.english);
}

/**
 * Check if multilingual slug is complete
 */
export function isMultilingualSlugComplete(slug: MultilingualSlug | undefined): boolean {
  if (!slug) return false;
  return !!(slug.bengali?.current && slug.english?.current);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Analyze translation completeness for a document
 */
export function analyzeTranslationCompleteness(
  document: any,
  requiredFields: string[]
): {
  bengali: TranslationStatus;
  english: TranslationStatus;
} {
  const bengaliMissing: string[] = [];
  const englishMissing: string[] = [];
  let bengaliWordCount = 0;
  let englishWordCount = 0;

  requiredFields.forEach(field => {
    const fieldValue = getNestedValue(document, field);
    
    if (fieldValue && typeof fieldValue === 'object') {
      // Handle multilingual text fields
      if (fieldValue.bengali !== undefined && fieldValue.english !== undefined) {
        if (!fieldValue.bengali) bengaliMissing.push(field);
        if (!fieldValue.english) englishMissing.push(field);
        
        bengaliWordCount += countWords(fieldValue.bengali || '');
        englishWordCount += countWords(fieldValue.english || '');
      }
      // Handle multilingual slug fields
      else if (fieldValue.bengali?.current !== undefined && fieldValue.english?.current !== undefined) {
        if (!fieldValue.bengali?.current) bengaliMissing.push(field);
        if (!fieldValue.english?.current) englishMissing.push(field);
      }
    }
  });

  return {
    bengali: {
      language: 'bengali',
      isComplete: bengaliMissing.length === 0,
      missingFields: bengaliMissing,
      wordCount: bengaliWordCount,
    },
    english: {
      language: 'english',
      isComplete: englishMissing.length === 0,
      missingFields: englishMissing,
      wordCount: englishWordCount,
    },
  };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get documents with incomplete translations
 */
export async function getIncompleteTranslations(
  documentType: string,
  requiredFields: string[]
): Promise<TranslationWorkflowItem[]> {
  try {
    const query = `*[_type == $documentType] {
      _id,
      _type,
      _updatedAt,
      title,
      ${requiredFields.join(',\n      ')}
    }`;

    const documents = await client.fetch(query, { documentType });
    
    return documents
      .map((doc: any) => {
        const status = analyzeTranslationCompleteness(doc, requiredFields);
        
        return {
          documentId: doc._id,
          documentType: doc._type,
          title: doc.title,
          status,
          priority: determinePriority(doc, status),
        };
      })
      .filter((item: TranslationWorkflowItem) => 
        !item.status.bengali.isComplete || !item.status.english.isComplete
      );
  } catch (error) {
    console.error('Error fetching incomplete translations:', error);
    return [];
  }
}

/**
 * Determine translation priority based on document and status
 */
function determinePriority(
  document: any,
  status: { bengali: TranslationStatus; english: TranslationStatus }
): 'high' | 'medium' | 'low' {
  // High priority: Published content with missing translations
  if (document.publishedAt && (!status.bengali.isComplete || !status.english.isComplete)) {
    return 'high';
  }
  
  // Medium priority: Featured content or important pages
  if (document.featured || document.isLeadership || document._type === 'page') {
    return 'medium';
  }
  
  // Low priority: Draft content
  return 'low';
}

/**
 * Create translation task
 */
export async function createTranslationTask(
  documentId: string,
  language: Language,
  assignedTo: string,
  dueDate?: string,
  notes?: string
): Promise<boolean> {
  try {
    const task = {
      _type: 'translationTask',
      documentId,
      language,
      assignedTo,
      dueDate,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await client.create(task);
    return true;
  } catch (error) {
    console.error('Error creating translation task:', error);
    return false;
  }
}

/**
 * Update translation progress
 */
export async function updateTranslationProgress(
  documentId: string,
  language: Language,
  progress: number,
  notes?: string
): Promise<boolean> {
  try {
    const taskQuery = `*[_type == "translationTask" && documentId == $documentId && language == $language][0]`;
    const task = await client.fetch(taskQuery, { documentId, language });
    
    if (task) {
      await client
        .patch(task._id)
        .set({
          progress,
          notes,
          updatedAt: new Date().toISOString(),
        })
        .commit();
    }
    
    return true;
  } catch (error) {
    console.error('Error updating translation progress:', error);
    return false;
  }
}

/**
 * Mark translation as complete
 */
export async function completeTranslation(
  documentId: string,
  language: Language,
  completedBy: string
): Promise<boolean> {
  try {
    const taskQuery = `*[_type == "translationTask" && documentId == $documentId && language == $language][0]`;
    const task = await client.fetch(taskQuery, { documentId, language });
    
    if (task) {
      await client
        .patch(task._id)
        .set({
          status: 'completed',
          completedBy,
          completedAt: new Date().toISOString(),
        })
        .commit();
    }
    
    return true;
  } catch (error) {
    console.error('Error completing translation:', error);
    return false;
  }
}

/**
 * Get translation statistics
 */
export async function getTranslationStatistics(documentType?: string): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  byLanguage: {
    bengali: { completed: number; pending: number };
    english: { completed: number; pending: number };
  };
}> {
  try {
    const typeFilter = documentType ? `&& documentType == "${documentType}"` : '';
    const query = `{
      "total": count(*[_type == "translationTask" ${typeFilter}]),
      "completed": count(*[_type == "translationTask" && status == "completed" ${typeFilter}]),
      "inProgress": count(*[_type == "translationTask" && status == "in_progress" ${typeFilter}]),
      "pending": count(*[_type == "translationTask" && status == "pending" ${typeFilter}]),
      "bengaliCompleted": count(*[_type == "translationTask" && language == "bengali" && status == "completed" ${typeFilter}]),
      "bengaliPending": count(*[_type == "translationTask" && language == "bengali" && status != "completed" ${typeFilter}]),
      "englishCompleted": count(*[_type == "translationTask" && language == "english" && status == "completed" ${typeFilter}]),
      "englishPending": count(*[_type == "translationTask" && language == "english" && status != "completed" ${typeFilter}])
    }`;

    const stats = await client.fetch(query);
    
    return {
      total: stats.total,
      completed: stats.completed,
      inProgress: stats.inProgress,
      pending: stats.pending,
      byLanguage: {
        bengali: {
          completed: stats.bengaliCompleted,
          pending: stats.bengaliPending,
        },
        english: {
          completed: stats.englishCompleted,
          pending: stats.englishPending,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching translation statistics:', error);
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      byLanguage: {
        bengali: { completed: 0, pending: 0 },
        english: { completed: 0, pending: 0 },
      },
    };
  }
}

/**
 * Sync translations between languages (copy structure)
 */
export async function syncTranslationStructure(
  documentId: string,
  fromLanguage: Language,
  toLanguage: Language,
  fields: string[]
): Promise<boolean> {
  try {
    const document = await client.getDocument(documentId);
    if (!document) return false;

    const updates: any = {};
    
    fields.forEach(field => {
      const sourceValue = getNestedValue(document, `${field}.${fromLanguage}`);
      if (sourceValue && !getNestedValue(document, `${field}.${toLanguage}`)) {
        // Create placeholder for missing translation
        setNestedValue(updates, `${field}.${toLanguage}`, `[${toLanguage.toUpperCase()} TRANSLATION NEEDED] ${sourceValue}`);
      }
    });

    if (Object.keys(updates).length > 0) {
      await client.patch(documentId).set(updates).commit();
    }

    return true;
  } catch (error) {
    console.error('Error syncing translation structure:', error);
    return false;
  }
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Validate language-specific content
 */
export function validateLanguageContent(
  content: string,
  language: Language
): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      warnings: ['Content is empty'],
      suggestions: ['Add content for this field'],
    };
  }

  // Language-specific validation
  if (language === 'bengali') {
    // Check for Bengali script
    const bengaliRegex = /[\u0980-\u09FF]/;
    if (!bengaliRegex.test(content)) {
      warnings.push('Content does not contain Bengali script');
      suggestions.push('Ensure content is written in Bengali');
    }

    // Check for common English words that might indicate incomplete translation
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const hasEnglishWords = englishWords.some(word => 
      content.toLowerCase().includes(` ${word} `) || 
      content.toLowerCase().startsWith(`${word} `) ||
      content.toLowerCase().endsWith(` ${word}`)
    );
    
    if (hasEnglishWords) {
      warnings.push('Content may contain untranslated English words');
      suggestions.push('Review content for complete Bengali translation');
    }
  } else if (language === 'english') {
    // Check for proper English
    const bengaliRegex = /[\u0980-\u09FF]/;
    if (bengaliRegex.test(content)) {
      warnings.push('Content contains Bengali script');
      suggestions.push('Ensure content is written in English');
    }
  }

  // General content quality checks
  const wordCount = countWords(content);
  if (wordCount < 5) {
    warnings.push('Content is very short');
    suggestions.push('Consider adding more descriptive content');
  }

  // Check for placeholder text
  const placeholderPatterns = [
    /\[.*TRANSLATION NEEDED.*\]/i,
    /lorem ipsum/i,
    /placeholder/i,
    /TODO/i,
  ];

  const hasPlaceholder = placeholderPatterns.some(pattern => pattern.test(content));
  if (hasPlaceholder) {
    warnings.push('Content contains placeholder text');
    suggestions.push('Replace placeholder text with actual content');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

/**
 * Generate translation report for a document
 */
export async function generateTranslationReport(
  documentId: string,
  requiredFields: string[]
): Promise<{
  documentId: string;
  documentType: string;
  title: string;
  completeness: {
    bengali: TranslationStatus;
    english: TranslationStatus;
  };
  fieldAnalysis: Array<{
    field: string;
    bengali: { isComplete: boolean; wordCount: number; quality: any };
    english: { isComplete: boolean; wordCount: number; quality: any };
  }>;
  recommendations: string[];
}> {
  try {
    const document = await client.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const completeness = analyzeTranslationCompleteness(document, requiredFields);
    const fieldAnalysis: any[] = [];
    const recommendations: string[] = [];

    requiredFields.forEach(field => {
      const fieldValue = getNestedValue(document, field);
      
      if (fieldValue && typeof fieldValue === 'object' && fieldValue.bengali !== undefined && fieldValue.english !== undefined) {
        const bengaliQuality = validateLanguageContent(fieldValue.bengali || '', 'bengali');
        const englishQuality = validateLanguageContent(fieldValue.english || '', 'english');
        
        fieldAnalysis.push({
          field,
          bengali: {
            isComplete: !!fieldValue.bengali,
            wordCount: countWords(fieldValue.bengali || ''),
            quality: bengaliQuality,
          },
          english: {
            isComplete: !!fieldValue.english,
            wordCount: countWords(fieldValue.english || ''),
            quality: englishQuality,
          },
        });

        // Generate recommendations
        if (!fieldValue.bengali) {
          recommendations.push(`Add Bengali translation for ${field}`);
        } else if (!bengaliQuality.isValid) {
          recommendations.push(`Improve Bengali content quality for ${field}: ${bengaliQuality.warnings.join(', ')}`);
        }

        if (!fieldValue.english) {
          recommendations.push(`Add English translation for ${field}`);
        } else if (!englishQuality.isValid) {
          recommendations.push(`Improve English content quality for ${field}: ${englishQuality.warnings.join(', ')}`);
        }
      }
    });

    return {
      documentId,
      documentType: document._type,
      title: getLocalizedText(document.title, 'english') || getLocalizedText(document.title, 'bengali') || 'Untitled',
      completeness,
      fieldAnalysis,
      recommendations,
    };
  } catch (error) {
    console.error('Error generating translation report:', error);
    throw error;
  }
}

/**
 * Bulk update translation status for multiple documents
 */
export async function bulkUpdateTranslationStatus(
  documentIds: string[],
  language: Language,
  status: 'pending' | 'in_progress' | 'completed',
  updatedBy: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const documentId of documentIds) {
    try {
      const taskQuery = `*[_type == "translationTask" && documentId == $documentId && language == $language][0]`;
      const task = await client.fetch(taskQuery, { documentId, language });
      
      if (task) {
        await client
          .patch(task._id)
          .set({
            status,
            updatedBy,
            updatedAt: new Date().toISOString(),
          })
          .commit();
        success++;
      } else {
        // Create new task if it doesn't exist
        await client.create({
          _type: 'translationTask',
          documentId,
          language,
          status,
          assignedTo: updatedBy,
          createdAt: new Date().toISOString(),
        });
        success++;
      }
    } catch (error) {
      failed++;
      errors.push(`Failed to update ${documentId}: ${error}`);
    }
  }

  return { success, failed, errors };
}