import type { MultilingualText, MultilingualSlug } from '@/types/sanity'

export type Language = 'bengali' | 'english'

/**
 * Get text content in the specified language with fallback
 */
export function getLocalizedText(
  content: MultilingualText | undefined,
  language: Language
): string {
  if (!content) return ''
  
  const text = content[language]
  if (text) return text
  
  // Fallback to the other language if current language is not available
  const fallbackLanguage = language === 'bengali' ? 'english' : 'bengali'
  return content[fallbackLanguage] || ''
}

/**
 * Get slug in the specified language with fallback
 */
export function getLocalizedSlug(
  slug: MultilingualSlug | undefined,
  language: Language
): string {
  if (!slug) return ''
  
  const currentSlug = slug[language]?.current
  if (currentSlug) return currentSlug
  
  // Fallback to the other language if current language is not available
  const fallbackLanguage = language === 'bengali' ? 'english' : 'bengali'
  return slug[fallbackLanguage]?.current || ''
}

/**
 * Get array content in the specified language with fallback
 */
export function getLocalizedArray(
  content: { bengali: string[]; english: string[] } | undefined,
  language: Language
): string[] {
  if (!content) return []
  
  const array = content[language]
  if (array && array.length > 0) return array
  
  // Fallback to the other language if current language is not available
  const fallbackLanguage = language === 'bengali' ? 'english' : 'bengali'
  return content[fallbackLanguage] || []
}

/**
 * Check if multilingual content has content in the specified language
 */
export function hasLocalizedContent(
  content: MultilingualText | undefined,
  language: Language
): boolean {
  if (!content) return false
  return Boolean(content[language] && content[language].trim().length > 0)
}

/**
 * Format date for display in Bengali or English
 */
export function formatDate(
  date: string | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  
  if (language === 'bengali') {
    // Use Bengali locale if available, otherwise use English with Bengali numerals
    try {
      return dateObj.toLocaleDateString('bn-BD', formatOptions)
    } catch {
      // Fallback to English formatting
      return dateObj.toLocaleDateString('en-US', formatOptions)
    }
  }
  
  return dateObj.toLocaleDateString('en-US', formatOptions)
}

/**
 * Convert English numerals to Bengali numerals
 */
export function toBengaliNumerals(text: string): string {
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return text.replace(/\d/g, (digit) => bengaliNumerals[parseInt(digit)])
}

/**
 * Get appropriate font class for the language
 */
export function getFontClass(language: Language): string {
  return language === 'bengali' ? 'font-bengali' : 'font-english'
}

/**
 * Get text direction for the language (useful for Arabic text in Islamic content)
 */
export function getTextDirection(language: Language): 'ltr' | 'rtl' {
  // Both Bengali and English are LTR
  // This function is prepared for future Arabic content support
  return 'ltr'
}

/**
 * Truncate text with proper handling for different languages
 */
export function truncateText(
  text: string,
  maxLength: number,
  language: Language
): string {
  if (text.length <= maxLength) return text
  
  // For Bengali, we might want different truncation logic
  // For now, using the same logic for both languages
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

/**
 * Generate SEO-friendly URL slug from text
 */
export function generateSlug(text: string, language: Language): string {
  if (language === 'bengali') {
    // For Bengali text, we might want to transliterate or use a different approach
    // For now, using a simple approach
    return text
      .toLowerCase()
      .replace(/[^\u0980-\u09FF\s]/g, '') // Keep only Bengali characters and spaces
      .replace(/\s+/g, '-')
      .trim()
  }
  
  // For English text
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

/**
 * Get language-specific CSS classes
 */
export function getLanguageClasses(language: Language): string {
  const baseClasses = getFontClass(language)
  const directionClass = getTextDirection(language) === 'rtl' ? 'rtl' : 'ltr'
  
  return `${baseClasses} ${directionClass}`
}