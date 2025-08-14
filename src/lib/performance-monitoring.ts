/**
 * Performance monitoring utilities for image and asset optimization
 */

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

/**
 * Measure Core Web Vitals
 */
export function measureCoreWebVitals(): Promise<Partial<PerformanceMetrics>> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }

    const metrics: Partial<PerformanceMetrics> = {};

    // Measure LCP
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Measure FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Measure CLS
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Measure FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Measure TTFB
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        metrics.ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
      }

      // Resolve after a delay to collect metrics
      setTimeout(() => resolve(metrics), 3000);
    } else {
      resolve({});
    }
  });
}

/**
 * Monitor image loading performance
 */
export function monitorImagePerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  const imageObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('image') || entry.name.includes('.jpg') || 
          entry.name.includes('.png') || entry.name.includes('.webp')) {
        console.log(`Image loaded: ${entry.name} in ${entry.duration}ms`);
        
        // Track slow loading images
        if (entry.duration > 1000) {
          console.warn(`Slow image loading detected: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });
  });

  imageObserver.observe({ entryTypes: ['resource'] });
}

/**
 * Monitor font loading performance
 */
export function monitorFontPerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  const fontObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('font') || entry.name.includes('.woff')) {
        console.log(`Font loaded: ${entry.name} in ${entry.duration}ms`);
        
        // Track slow loading fonts
        if (entry.duration > 500) {
          console.warn(`Slow font loading detected: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });
  });

  fontObserver.observe({ entryTypes: ['resource'] });
}

/**
 * Monitor bundle size and loading performance
 */
export function monitorBundlePerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  const bundleObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('_next/static/chunks/')) {
        console.log(`Bundle loaded: ${entry.name} in ${entry.duration}ms`);
        
        // Track large bundles
        if ((entry as any).transferSize > 100000) { // 100KB
          console.warn(`Large bundle detected: ${entry.name} is ${(entry as any).transferSize} bytes`);
        }
      }
    });
  });

  bundleObserver.observe({ entryTypes: ['resource'] });
}

/**
 * Get performance recommendations based on metrics
 */
export function getPerformanceRecommendations(metrics: Partial<PerformanceMetrics>): string[] {
  const recommendations: string[] = [];

  if (metrics.lcp && metrics.lcp > 2500) {
    recommendations.push('Consider optimizing images and reducing server response time to improve LCP');
  }

  if (metrics.fid && metrics.fid > 100) {
    recommendations.push('Consider reducing JavaScript execution time to improve FID');
  }

  if (metrics.cls && metrics.cls > 0.1) {
    recommendations.push('Consider adding size attributes to images and reserving space for dynamic content to improve CLS');
  }

  if (metrics.fcp && metrics.fcp > 1800) {
    recommendations.push('Consider optimizing critical resources and reducing render-blocking resources to improve FCP');
  }

  if (metrics.ttfb && metrics.ttfb > 600) {
    recommendations.push('Consider optimizing server response time and using CDN to improve TTFB');
  }

  return recommendations;
}

/**
 * Report performance metrics to analytics
 */
export function reportPerformanceMetrics(metrics: Partial<PerformanceMetrics>) {
  // This would typically send to your analytics service
  console.log('Performance Metrics:', metrics);
  
  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    Object.entries(metrics).forEach(([metric, value]) => {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric,
        metric_value: Math.round(value),
      });
    });
  }
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Start monitoring
  monitorImagePerformance();
  monitorFontPerformance();
  monitorBundlePerformance();

  // Measure and report Core Web Vitals
  measureCoreWebVitals().then((metrics) => {
    const recommendations = getPerformanceRecommendations(metrics);
    if (recommendations.length > 0) {
      console.log('Performance Recommendations:', recommendations);
    }
    reportPerformanceMetrics(metrics);
  });

  // Monitor network conditions
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    console.log(`Network: ${connection.effectiveType}, Save Data: ${connection.saveData}`);
  }
}

/**
 * Lazy load images with intersection observer
 */
export function setupLazyLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01,
  });

  // Observe all images with data-src attribute
  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
}