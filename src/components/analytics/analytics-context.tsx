'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { EffectiveConsent } from '@/lib/analytics/types';
import {
  acceptAllConsent,
  getEffectiveConsent,
  rejectNonEssentialConsent,
  updateConsentPreferences,
} from '@/lib/analytics/consent';
import {
  buildConsentDefault,
  buildConsentUpdate,
} from '@/lib/analytics/events';
import { pushToDataLayer, setAnalyticsConsent } from '@/lib/analytics/push';
import { toConsentStorage } from '@/lib/analytics/consent';

interface AnalyticsContextValue {
  consent: EffectiveConsent;
  countryCode: string | null;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (analytics: boolean, advertising: boolean) => void;
  pushConsentUpdate: (consent: EffectiveConsent) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  children,
  countryCode,
}: {
  children: ReactNode;
  countryCode: string | null;
}) {
  const [consent, setConsent] = useState<EffectiveConsent>(() =>
    getEffectiveConsent(countryCode)
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const pushConsentUpdate = useCallback((next: EffectiveConsent) => {
    pushToDataLayer(
      buildConsentUpdate({
        analytics_storage: toConsentStorage(next.analytics),
        ad_storage: toConsentStorage(next.advertising),
      })
    );
  }, []);

  const acceptAll = useCallback(() => {
    const next = acceptAllConsent(countryCode);
    setAnalyticsConsent(next);
    setConsent(next);
    pushConsentUpdate(next);
    setPreferencesOpen(false);
  }, [countryCode, pushConsentUpdate]);

  const rejectNonEssential = useCallback(() => {
    const next = rejectNonEssentialConsent(countryCode);
    setAnalyticsConsent(next);
    setConsent(next);
    pushConsentUpdate(next);
    setPreferencesOpen(false);
  }, [countryCode, pushConsentUpdate]);

  const savePreferences = useCallback(
    (analytics: boolean, advertising: boolean) => {
      const next = updateConsentPreferences(countryCode, { analytics, advertising });
      setAnalyticsConsent(next);
      setConsent(next);
      pushConsentUpdate(next);
      setPreferencesOpen(false);
    },
    [countryCode, pushConsentUpdate]
  );

  const value = useMemo(
    () => ({
      consent,
      countryCode,
      preferencesOpen,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      acceptAll,
      rejectNonEssential,
      savePreferences,
      pushConsentUpdate,
    }),
    [
      consent,
      countryCode,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      pushConsentUpdate,
    ]
  );

  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

export function pushConsentDefaultEvent(consent: EffectiveConsent): void {
  pushToDataLayer(
    buildConsentDefault({
      analytics_storage: toConsentStorage(consent.analytics),
      ad_storage: toConsentStorage(consent.advertising),
      region: consent.region,
      consent_mode: 'default',
    })
  );
}
