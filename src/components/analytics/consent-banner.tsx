'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/site/link';
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
    <div className="fixed inset-x-0 bottom-0 z-[9998] border-t border-line-dark bg-dark py-4 text-on-dark shadow-bar">
      <div className="page-wrap flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        <p className="m-0 text-15 text-on-dark-body lg:min-w-0 lg:flex-1">
          {consent.requiresOptIn ? t('regulatedMessage') : t('noticeMessage')}{' '}
          <Link href={`${policyBase}/cookie-policy`} className="font-strong text-on-dark underline underline-offset-4">
            {t('learnMore')}
          </Link>
        </p>
        {/* The buttons keep one row beside the text on wide screens: the text takes what is left. */}
        <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              acceptAll();
              setVisible(false);
            }}
            className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-15 font-strong text-dark hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light"
          >
            {t('acceptAll')}
          </button>
          <button
            type="button"
            onClick={() => {
              rejectNonEssential();
              setVisible(false);
            }}
            className="inline-flex min-h-11 items-center rounded-full border border-line-dark-strong px-4 text-15 font-strong text-on-dark hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light"
          >
            {t('rejectNonEssential')}
          </button>
          <button
            type="button"
            onClick={openPreferences}
            className="inline-flex min-h-11 items-center rounded-full border border-line-dark-strong px-4 text-15 font-strong text-on-dark hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light"
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
