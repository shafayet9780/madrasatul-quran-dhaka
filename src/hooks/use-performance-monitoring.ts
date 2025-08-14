'use client';

import { useEffect, useRef, useState } from 'react';
import { trackPerformanceMetric, trackEvent } from '@/lib/analytics';

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  loadTime?: number;
  domContentLoaded?: number;
  firstByte?: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

/**
 * Hook for monitoring Core Web Vitals and performance metrics
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isLoading, setIsLoading] = useState(true);
  const observersRef = useRef<PerformanceObserver[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      setIsLoading(false);
      return;
    }

    const observers: PerformanceObserver[] = [];

    // Monitor LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcpValue = lastEntry.startTime;
        
        setMetrics(prev => ({ ...prev, lcp: lcpValue }));
        trackPerformanceMetric('LCP', lcpValue, 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported');
    }

    // Monitor FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          const fidValue = entry.processingStart - entry.startTime;
          setMetrics(prev => ({ ...prev, fid: fidValue }));
          trackPerformanceMetric('FID', fidValue, 'ms');
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported');
    }

    // Monitor CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: clsValue }));
        trackPerformanceMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported');
    }

    // Monitor FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            const fcpValue = entry.startTime;
            setMetrics(prev => ({ ...prev, fcp: fcpValue }));
            trackPerformanceMetric('FCP', fcpValue, 'ms');
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      observers.push(fcpObserver);
    } catch (error) {
      console.warn('FCP observer not supported');
    }

    // Monitor Navigation Timing
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      const ttfbValue = nav.responseStart - nav.requestStart;
      const loadTimeValue = nav.loadEventEnd - nav.navigationStart;
      const domContentLoadedValue = nav.domContentLoadedEventEnd - nav.navigationStart;

      setMetrics(prev => ({
        ...prev,
        ttfb: ttfbValue,
        loadTime: loadTimeValue,
        domContentLoaded: domContentLoadedValue,
      }));

      trackPerformanceMetric('TTFB', ttfbValue, 'ms');
      trackPerformanceMetric('Load Time', loadTimeValue, 'ms');
      trackPerformanceMetric('DOM Content Loaded', domContentLoadedValue, 'ms');
    }

    observersRef.current = observers;
    setIsLoading(false);

    // Cleanup observers on unmount
    return () => {
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Error disconnecting observer:', error);
        }
      });
    };
  }, []);

  return { metrics, isLoading };
}

/**
 * Hook for monitoring resource loading performance
 */
export function useResourceMonitoring() {
  const [resources, setResources] = useState<ResourceTiming[]>([]);
  const [slowResources, setSlowResources] = useState<ResourceTiming[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      const resourceData: ResourceTiming[] = entries.map(entry => {
        const size = (entry as any).transferSize || 0;
        const type = getResourceType(entry.name);
        
        return {
          name: entry.name,
          duration: entry.duration,
          size,
          type,
        };
      });

      setResources(prev => [...prev, ...resourceData]);

      // Track slow resources (>1s)
      const slow = resourceData.filter(resource => resource.duration > 1000);
      if (slow.length > 0) {
        setSlowResources(prev => [...prev, ...slow]);
        
        slow.forEach(resource => {
          trackEvent({
            action: 'slow_resource',
            category: 'performance',
            label: resource.name,
            value: Math.round(resource.duration),
            custom_parameters: {
              resource_type: resource.type,
              resource_size: resource.size,
              duration: resource.duration,
            },
          });
        });
      }
    });

    resourceObserver.observe({ entryTypes: ['resource'] });

    return () => {
      resourceObserver.disconnect();
    };
  }, []);

  return { resources, slowResources };
}

/**
 * Hook for monitoring user interactions and engagement
 */
export function useInteractionMonitoring() {
  const [interactions, setInteractions] = useState<Array<{
    type: string;
    timestamp: number;
    element?: string;
  }>>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trackInteraction = (type: string, event: Event) => {
      const element = (event.target as HTMLElement)?.tagName?.toLowerCase();
      const interaction = {
        type,
        timestamp: Date.now(),
        element,
      };

      setInteractions(prev => [...prev.slice(-50), interaction]); // Keep last 50 interactions

      trackEvent({
        action: 'user_interaction',
        category: 'engagement',
        label: `${type}_${element}`,
        custom_parameters: {
          interaction_type: type,
          element,
          page_url: window.location.pathname,
        },
      });
    };

    // Track various interaction types
    const eventTypes = ['click', 'scroll', 'keydown', 'touchstart'];
    const handlers: Array<{ type: string; handler: (e: Event) => void }> = [];

    eventTypes.forEach(eventType => {
      const handler = (e: Event) => trackInteraction(eventType, e);
      document.addEventListener(eventType, handler, { passive: true });
      handlers.push({ type: eventType, handler });
    });

    return () => {
      handlers.forEach(({ type, handler }) => {
        document.removeEventListener(type, handler);
      });
    };
  }, []);

  return { interactions };
}

/**
 * Hook for monitoring form performance and errors
 */
export function useFormMonitoring(formName: string) {
  const [formMetrics, setFormMetrics] = useState({
    startTime: 0,
    completionTime: 0,
    errors: 0,
    fieldInteractions: 0,
  });

  const startTracking = () => {
    setFormMetrics(prev => ({
      ...prev,
      startTime: Date.now(),
    }));

    trackEvent({
      action: 'form_start',
      category: 'form_engagement',
      label: formName,
    });
  };

  const trackFieldInteraction = (fieldName: string) => {
    setFormMetrics(prev => ({
      ...prev,
      fieldInteractions: prev.fieldInteractions + 1,
    }));

    trackEvent({
      action: 'form_field_interaction',
      category: 'form_engagement',
      label: `${formName}_${fieldName}`,
    });
  };

  const trackError = (fieldName: string, errorMessage: string) => {
    setFormMetrics(prev => ({
      ...prev,
      errors: prev.errors + 1,
    }));

    trackEvent({
      action: 'form_error',
      category: 'form_engagement',
      label: `${formName}_${fieldName}`,
      custom_parameters: {
        error_message: errorMessage,
        field_name: fieldName,
      },
    });
  };

  const trackCompletion = (success: boolean) => {
    const completionTime = Date.now();
    const duration = completionTime - formMetrics.startTime;

    setFormMetrics(prev => ({
      ...prev,
      completionTime,
    }));

    trackEvent({
      action: 'form_completion',
      category: 'form_engagement',
      label: formName,
      value: success ? 1 : 0,
      custom_parameters: {
        success,
        duration,
        field_interactions: formMetrics.fieldInteractions,
        errors: formMetrics.errors,
      },
    });
  };

  return {
    formMetrics,
    startTracking,
    trackFieldInteraction,
    trackError,
    trackCompletion,
  };
}

/**
 * Utility function to determine resource type
 */
function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
  if (url.includes('api/')) return 'api';
  return 'other';
}

/**
 * Hook for monitoring page visibility and engagement time
 */
export function usePageEngagement() {
  const [engagementTime, setEngagementTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const startTimeRef = useRef(Date.now());
  const lastVisibleTimeRef = useRef(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        // Page became hidden
        const sessionTime = now - lastVisibleTimeRef.current;
        setEngagementTime(prev => prev + sessionTime);
        setIsVisible(false);
        
        trackEvent({
          action: 'page_hidden',
          category: 'engagement',
          label: window.location.pathname,
          value: Math.round(sessionTime / 1000),
        });
      } else {
        // Page became visible
        lastVisibleTimeRef.current = now;
        setIsVisible(true);
        
        trackEvent({
          action: 'page_visible',
          category: 'engagement',
          label: window.location.pathname,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track engagement time on page unload
    const handleBeforeUnload = () => {
      const totalTime = Date.now() - startTimeRef.current;
      trackEvent({
        action: 'page_engagement_time',
        category: 'engagement',
        label: window.location.pathname,
        value: Math.round(totalTime / 1000),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return { engagementTime, isVisible };
}