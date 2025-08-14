/**
 * Font optimization utilities for better performance
 */

/**
 * Preload critical fonts
 */
export function preloadFonts() {
  if (typeof window === 'undefined') return;

  // Preload Inter font for English content
  const interLink = document.createElement('link');
  interLink.rel = 'preload';
  interLink.href = '/_next/static/media/inter-latin.woff2';
  interLink.as = 'font';
  interLink.type = 'font/woff2';
  interLink.crossOrigin = 'anonymous';
  document.head.appendChild(interLink);

  // Preload Noto Sans Bengali for Bengali content
  const bengaliLink = document.createElement('link');
  bengaliLink.rel = 'preload';
  bengaliLink.href = '/_next/static/media/noto-sans-bengali.woff2';
  bengaliLink.as = 'font';
  bengaliLink.type = 'font/woff2';
  bengaliLink.crossOrigin = 'anonymous';
  document.head.appendChild(bengaliLink);
}

/**
 * Font display strategies for different content types
 */
export const fontDisplayStrategies = {
  critical: 'swap', // For above-the-fold content
  important: 'fallback', // For important but not critical content
  optional: 'optional', // For decorative content
} as const;

/**
 * Get font class based on language and content type
 */
export function getFontClass(
  language: 'bengali' | 'english' | 'arabic',
  priority: 'critical' | 'important' | 'optional' = 'important'
): string {
  const baseClasses = {
    bengali: 'font-bengali',
    english: 'font-english',
    arabic: 'font-arabic',
  };

  const priorityClasses = {
    critical: 'font-display-swap',
    important: 'font-display-fallback',
    optional: 'font-display-optional',
  };

  return `${baseClasses[language]} ${priorityClasses[priority]}`;
}

/**
 * Font loading performance metrics
 */
export function measureFontLoadingPerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource' && entry.name.includes('font')) {
        console.log(`Font loaded: ${entry.name} in ${entry.duration}ms`);
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
}

/**
 * Optimize font loading based on user preferences
 */
export function optimizeFontLoading() {
  if (typeof window === 'undefined') return;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check for slow connection
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData
  );

  // Adjust font loading strategy based on conditions
  if (prefersReducedMotion || isSlowConnection) {
    document.documentElement.style.setProperty('--font-display', 'optional');
  } else {
    document.documentElement.style.setProperty('--font-display', 'swap');
  }
}

/**
 * Font subset loading for different languages
 */
export const fontSubsets = {
  bengali: ['bengali', 'latin'],
  english: ['latin', 'latin-ext'],
  arabic: ['arabic', 'latin'],
} as const;

/**
 * Get optimal font subset for language
 */
export function getOptimalFontSubset(language: keyof typeof fontSubsets): string[] {
  return fontSubsets[language];
}

/**
 * Critical font CSS for inline styles
 */
export const criticalFontCSS = `
  .font-english { font-family: var(--font-english), system-ui, -apple-system, sans-serif; }
  .font-bengali { font-family: var(--font-bengali), 'SolaimanLipi', 'Kalpurush', sans-serif; }
  .font-arabic { font-family: var(--font-arabic), 'Times New Roman', serif; }
  
  .font-display-swap { font-display: swap; }
  .font-display-fallback { font-display: fallback; }
  .font-display-optional { font-display: optional; }
`;

/**
 * Generate font preload links for HTML head
 */
export function generateFontPreloadLinks(languages: ('bengali' | 'english' | 'arabic')[]): string {
  const preloadLinks: string[] = [];

  if (languages.includes('english')) {
    preloadLinks.push(
      '<link rel="preload" href="/_next/static/media/inter-latin.woff2" as="font" type="font/woff2" crossorigin="anonymous">'
    );
  }

  if (languages.includes('bengali')) {
    preloadLinks.push(
      '<link rel="preload" href="/_next/static/media/noto-sans-bengali.woff2" as="font" type="font/woff2" crossorigin="anonymous">'
    );
  }

  if (languages.includes('arabic')) {
    preloadLinks.push(
      '<link rel="preload" href="/_next/static/media/amiri-arabic.woff2" as="font" type="font/woff2" crossorigin="anonymous">'
    );
  }

  return preloadLinks.join('\n');
}