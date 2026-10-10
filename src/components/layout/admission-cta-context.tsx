'use client';

import { createContext, useContext } from 'react';
import type { AdmissionCta } from '@/lib/admissions/intake';
import type { Language } from '@/types';
import { pushToDataLayer } from '@/lib/analytics/push';
import { buildViewContent } from '@/lib/analytics/events';

// The pre-admission intake (worked out on the server in the locale layout), for the banner and the
// calls to action in client components.

const AdmissionCtaContext = createContext<AdmissionCta | null>(null);

export const AdmissionCtaProvider = AdmissionCtaContext.Provider;

export function useAdmissionCta(): AdmissionCta | null {
  return useContext(AdmissionCtaContext);
}

export function trackAdmissionCta(location: string, locale: Language) {
  pushToDataLayer(
    buildViewContent({
      content_type: 'admission_cta',
      content_id: location,
      locale,
      page_path: typeof window !== 'undefined' ? window.location.pathname : '/',
    }),
  );
}
