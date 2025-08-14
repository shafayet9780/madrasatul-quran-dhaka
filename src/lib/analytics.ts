/**
 * Analytics and tracking utilities
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface ConversionEvent {
  event_name: string;
  currency?: string;
  value?: number;
  items?: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity?: number;
    price?: number;
  }>;
}

/**
 * Initialize Google Analytics
 */
export function initializeAnalytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Configure Google Analytics
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
    anonymize_ip: true, // GDPR compliance
    allow_google_signals: false, // Disable advertising features for privacy
    cookie_flags: 'SameSite=Strict;Secure', // Enhanced cookie security
  });

  // Track initial page view
  trackPageView(window.location.pathname);
}

/**
 * Track page views
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track custom events
 */
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    ...event.custom_parameters,
  });
}

/**
 * Track conversion events
 */
export function trackConversion(event: ConversionEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', event.event_name, {
    currency: event.currency,
    value: event.value,
    items: event.items,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmission(formName: string, success: boolean, errorMessage?: string) {
  trackEvent({
    action: 'form_submit',
    category: 'engagement',
    label: formName,
    value: success ? 1 : 0,
    custom_parameters: {
      form_name: formName,
      success: success,
      error_message: errorMessage,
    },
  });
}

/**
 * Track user interactions
 */
export function trackUserInteraction(interactionType: string, element: string, details?: Record<string, any>) {
  trackEvent({
    action: 'user_interaction',
    category: 'engagement',
    label: `${interactionType}_${element}`,
    custom_parameters: {
      interaction_type: interactionType,
      element: element,
      ...details,
    },
  });
}

/**
 * Track file downloads
 */
export function trackDownload(fileName: string, fileType: string, fileSize?: number) {
  trackEvent({
    action: 'file_download',
    category: 'engagement',
    label: fileName,
    custom_parameters: {
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
    },
  });
}

/**
 * Track external link clicks
 */
export function trackExternalLink(url: string, linkText?: string) {
  trackEvent({
    action: 'external_link_click',
    category: 'engagement',
    label: url,
    custom_parameters: {
      link_url: url,
      link_text: linkText,
    },
  });
}

/**
 * Track search queries
 */
export function trackSearch(query: string, resultsCount: number, category?: string) {
  trackEvent({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultsCount,
    custom_parameters: {
      search_term: query,
      results_count: resultsCount,
      search_category: category,
    },
  });
}

/**
 * Track language changes
 */
export function trackLanguageChange(fromLanguage: string, toLanguage: string) {
  trackEvent({
    action: 'language_change',
    category: 'user_preference',
    label: `${fromLanguage}_to_${toLanguage}`,
    custom_parameters: {
      from_language: fromLanguage,
      to_language: toLanguage,
    },
  });
}

/**
 * Track admission inquiries
 */
export function trackAdmissionInquiry(inquiryType: string, program?: string) {
  trackConversion({
    event_name: 'admission_inquiry',
    value: 1,
    items: [
      {
        item_id: 'admission_inquiry',
        item_name: 'Admission Inquiry',
        category: inquiryType,
        quantity: 1,
        price: 1,
      },
    ],
  });

  trackEvent({
    action: 'admission_inquiry',
    category: 'conversion',
    label: inquiryType,
    custom_parameters: {
      inquiry_type: inquiryType,
      program: program,
    },
  });
}

/**
 * Track contact form submissions
 */
export function trackContactSubmission(contactType: string, success: boolean) {
  if (success) {
    trackConversion({
      event_name: 'contact_submission',
      value: 1,
    });
  }

  trackEvent({
    action: 'contact_form_submit',
    category: 'conversion',
    label: contactType,
    value: success ? 1 : 0,
    custom_parameters: {
      contact_type: contactType,
      success: success,
    },
  });
}

/**
 * Track performance metrics
 */
export function trackPerformanceMetric(metricName: string, value: number, unit?: string) {
  trackEvent({
    action: 'performance_metric',
    category: 'performance',
    label: metricName,
    value: Math.round(value),
    custom_parameters: {
      metric_name: metricName,
      metric_value: value,
      unit: unit,
    },
  });
}

/**
 * Track Core Web Vitals
 */
export function trackCoreWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Track LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    trackPerformanceMetric('LCP', lastEntry.startTime, 'ms');
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Track FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      const fid = entry.processingStart - entry.startTime;
      trackPerformanceMetric('FID', fid, 'ms');
    });
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  // Track CLS (Cumulative Layout Shift)
  const clsObserver = new PerformanceObserver((list) => {
    let clsValue = 0;
    list.getEntries().forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    trackPerformanceMetric('CLS', clsValue);
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // Track FCP (First Contentful Paint)
  const fcpObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        trackPerformanceMetric('FCP', entry.startTime, 'ms');
      }
    });
  });
  fcpObserver.observe({ entryTypes: ['paint'] });

  // Track TTFB (Time to First Byte)
  const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (navigationEntries.length > 0) {
    const ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
    trackPerformanceMetric('TTFB', ttfb, 'ms');
  }
}

/**
 * Track user demographics and preferences
 */
export function trackUserDemographics(language: string, location?: string, deviceType?: string) {
  trackEvent({
    action: 'user_demographics',
    category: 'user_data',
    label: language,
    custom_parameters: {
      language: language,
      location: location,
      device_type: deviceType,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    },
  });
}

/**
 * Track errors and exceptions
 */
export function trackError(error: Error, context?: string) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'exception', {
    description: error.message,
    fatal: false,
    custom_parameters: {
      error_name: error.name,
      error_stack: error.stack,
      context: context,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    },
  });
}

/**
 * Initialize all analytics and monitoring
 */
export function initializeAllAnalytics() {
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize Google Analytics
  initializeAnalytics();

  // Track Core Web Vitals
  trackCoreWebVitals();

  // Track user demographics
  const language = document.documentElement.lang || 'en';
  const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  trackUserDemographics(language, undefined, deviceType);

  // Set up global error tracking
  window.addEventListener('error', (event) => {
    trackError(new Error(event.message), 'global_error_handler');
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), 'unhandled_promise_rejection');
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    trackEvent({
      action: 'page_visibility_change',
      category: 'engagement',
      label: document.hidden ? 'hidden' : 'visible',
    });
  });

  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', () => {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
      maxScrollDepth = scrollDepth;
      trackEvent({
        action: 'scroll_depth',
        category: 'engagement',
        label: `${scrollDepth}%`,
        value: scrollDepth,
      });
    }
  });
}