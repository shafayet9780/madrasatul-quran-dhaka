'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initializeAllAnalytics, trackPageView } from '@/lib/analytics';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const GA_MEASUREMENT_ID = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams, GA_MEASUREMENT_ID]);

  useEffect(() => {
    // Initialize analytics when component mounts
    initializeAllAnalytics();
  }, []);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: false, // We handle this manually
              anonymize_ip: true,
              allow_google_signals: false,
              cookie_flags: 'SameSite=Strict;Secure',
              custom_map: {
                'custom_parameter_1': 'language',
                'custom_parameter_2': 'user_type',
                'custom_parameter_3': 'page_category'
              }
            });
          `,
        }}
      />
    </>
  );
}

// Performance monitoring component
export function PerformanceMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    }).catch(() => {
      // Fallback if web-vitals is not available
      console.log('Web Vitals library not available');
    });

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Log slow resources
            if (resourceEntry.duration > 1000) {
              console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}

// Cookie consent component for GDPR compliance
export function CookieConsent() {
  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookie-consent');
    
    if (!hasConsented) {
      // Show cookie consent banner
      const banner = document.createElement('div');
      banner.innerHTML = `
        <div id="cookie-consent" style="
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1f2937;
          color: white;
          padding: 1rem;
          z-index: 9999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        ">
          <div style="flex: 1; min-width: 300px;">
            <p style="margin: 0; font-size: 0.875rem;">
              We use cookies to improve your experience and analyze site usage. 
              By continuing to use our site, you consent to our use of cookies.
              <a href="/privacy-policy" style="color: #60a5fa; text-decoration: underline; margin-left: 0.5rem;">
                Learn more
              </a>
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button id="accept-cookies" style="
              background: #059669;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 0.875rem;
            ">
              Accept
            </button>
            <button id="decline-cookies" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 0.875rem;
            ">
              Decline
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(banner);

      // Handle consent
      const acceptBtn = document.getElementById('accept-cookies');
      const declineBtn = document.getElementById('decline-cookies');
      const consentBanner = document.getElementById('cookie-consent');

      acceptBtn?.addEventListener('click', () => {
        localStorage.setItem('cookie-consent', 'accepted');
        consentBanner?.remove();
        
        // Initialize analytics after consent
        initializeAllAnalytics();
      });

      declineBtn?.addEventListener('click', () => {
        localStorage.setItem('cookie-consent', 'declined');
        consentBanner?.remove();
        
        // Disable analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
          });
        }
      });
    } else if (hasConsented === 'accepted') {
      // User has already consented, initialize analytics
      initializeAllAnalytics();
    }
  }, []);

  return null;
}

// Component to track specific user interactions
export function InteractionTracker({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;
      
      // Track button clicks
      if (tagName === 'button' || target.closest('button')) {
        const button = tagName === 'button' ? target : target.closest('button');
        const buttonText = button?.textContent?.trim() || 'Unknown';
        
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'button_click', {
            event_category: 'engagement',
            event_label: buttonText,
            custom_parameters: {
              button_id: id,
              button_class: className,
              page_url: window.location.pathname,
            },
          });
        }
      }
      
      // Track link clicks
      if (tagName === 'a' || target.closest('a')) {
        const link = tagName === 'a' ? target as HTMLAnchorElement : target.closest('a');
        const href = link?.href;
        const linkText = link?.textContent?.trim() || 'Unknown';
        
        if (href && typeof window !== 'undefined' && window.gtag) {
          const isExternal = !href.startsWith(window.location.origin);
          
          window.gtag('event', 'link_click', {
            event_category: 'engagement',
            event_label: linkText,
            custom_parameters: {
              link_url: href,
              is_external: isExternal,
              page_url: window.location.pathname,
            },
          });
        }
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return <>{children}</>;
}