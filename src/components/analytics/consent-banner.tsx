'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAnalytics } from './analytics-context';
import { readStoredConsent } from '@/lib/analytics/consent';

export function ConsentBanner() {
  const t = useTranslations('analytics.consent');
  const locale = useLocale();
  const {
    consent,
    preferencesOpen,
    openPreferences,
    closePreferences,
    acceptAll,
    rejectNonEssential,
    savePreferences,
  } = useAnalytics();

  const [visible, setVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(consent.analytics);
  const [advertisingEnabled, setAdvertisingEnabled] = useState(consent.advertising);

  useEffect(() => {
    const stored = readStoredConsent();
    if (!stored && consent.requiresOptIn) {
      setVisible(true);
    } else if (!stored && !consent.requiresOptIn) {
      setVisible(true);
    }
  }, [consent.requiresOptIn]);

  useEffect(() => {
    setAnalyticsEnabled(consent.analytics);
    setAdvertisingEnabled(consent.advertising);
  }, [consent.analytics, consent.advertising]);

  if (!visible && !preferencesOpen) {
    return null;
  }

  const policyBase = `/${locale}`;

  if (preferencesOpen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-labelledby="cookie-preferences-title"
        >
          <h2 id="cookie-preferences-title" className="text-lg font-semibold text-gray-900">
            {t('preferencesTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{t('preferencesDescription')}</p>

          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-gray-900">{t('analyticsTitle')}</span>
                <span className="block text-sm text-gray-600">{t('analyticsDescription')}</span>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={advertisingEnabled}
                onChange={(e) => setAdvertisingEnabled(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-gray-900">{t('advertisingTitle')}</span>
                <span className="block text-sm text-gray-600">{t('advertisingDescription')}</span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => savePreferences(analyticsEnabled, advertisingEnabled)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {t('savePreferences')}
            </button>
            <button
              type="button"
              onClick={closePreferences}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9998] border-t border-gray-700 bg-gray-900 p-4 text-white shadow-lg">
      <div className="container-custom flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-100">
          {consent.requiresOptIn ? t('regulatedMessage') : t('noticeMessage')}{' '}
          <Link href={`${policyBase}/cookie-policy`} className="underline text-blue-300">
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              acceptAll();
              setVisible(false);
            }}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700"
          >
            {t('acceptAll')}
          </button>
          <button
            type="button"
            onClick={() => {
              rejectNonEssential();
              setVisible(false);
            }}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-500"
          >
            {t('rejectNonEssential')}
          </button>
          <button
            type="button"
            onClick={openPreferences}
            className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-semibold hover:bg-gray-800"
          >
            {t('managePreferences')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferencesButton({ className = '' }: { className?: string }) {
  const t = useTranslations('analytics.consent');
  const { openPreferences } = useAnalytics();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={className}
    >
      {t('cookiePreferences')}
    </button>
  );
}
