'use client';

import Script from 'next/script';
import { useEffect, Suspense, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { buildPageView } from '@/lib/analytics/events';
import { pushToDataLayer, setAnalyticsConsent } from '@/lib/analytics/push';
import { shouldLoadGtm } from '@/lib/analytics/consent';
import { captureAttributionFromUrl } from '@/lib/analytics/attribution';
import { sanitizePathWithAllowedQuery } from '@/lib/analytics/url';
import {
  AnalyticsProvider,
  pushConsentDefaultEvent,
  useAnalytics,
} from './analytics-context';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent } = useAnalytics();
  const [mounted, setMounted] = useState(false);
  const hasPushedDefault = useRef(false);
  const gtmAllowed = shouldLoadGtm(consent);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAnalyticsConsent(consent);

    if (!hasPushedDefault.current) {
      hasPushedDefault.current = true;
      pushConsentDefaultEvent(consent);
    }

    captureAttributionFromUrl(consent);
  }, [consent]);

  useEffect(() => {
    if (!gtmAllowed) {
      return;
    }

    const locale = pathname.split('/').filter(Boolean)[0] || 'bengali';
    const query = searchParams.toString();
    const pagePath = sanitizePathWithAllowedQuery(pathname, query);

    pushToDataLayer(
      buildPageView({
        page_path: pagePath,
        page_title: typeof document !== 'undefined' ? document.title : pagePath,
        locale,
      })
    );
  }, [pathname, searchParams, gtmAllowed]);

  if (!mounted || !GTM_ID || !gtmAllowed) {
    if (process.env.NODE_ENV === 'development' && !GTM_ID) {
      console.warn('[analytics] NEXT_PUBLIC_GTM_ID is not set');
    }
    return null;
  }

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}

function AnalyticsTrackerBoundary() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}

export function AnalyticsRoot({
  children,
  countryCode,
}: {
  children: React.ReactNode;
  countryCode: string | null;
}) {
  return (
    <AnalyticsProvider countryCode={countryCode}>
      {children}
      <AnalyticsTrackerBoundary />
    </AnalyticsProvider>
  );
}
