import { sanitizeAnalyticsPayload } from './sanitize';
import { shouldLoadGtm } from './consent';
import type { EffectiveConsent, SafeAnalyticsEvent } from './types';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

let activeConsent: EffectiveConsent | null = null;

export function setAnalyticsConsent(consent: EffectiveConsent | null): void {
  activeConsent = consent;
}

export function canPushTrackedEvents(): boolean {
  return activeConsent ? shouldLoadGtm(activeConsent) : false;
}

export function initDataLayer(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
}

export function pushToDataLayer(payload: Record<string, unknown>): SafeAnalyticsEvent | null {
  if (typeof window === 'undefined') {
    return null;
  }

  initDataLayer();

  const sanitized = sanitizeAnalyticsPayload(payload);
  window.dataLayer.push(sanitized);

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', sanitized);
  }

  return sanitized;
}

export function pushAnalyticsEvent(event: SafeAnalyticsEvent): SafeAnalyticsEvent | null {
  return pushToDataLayer(event);
}

export function pushTrackedEvent(payload: Record<string, unknown>): SafeAnalyticsEvent | null {
  if (!canPushTrackedEvents()) {
    return null;
  }

  return pushToDataLayer(payload);
}
