import type { EffectiveConsent, SafeAttribution } from './types';
import { canPersistAttribution } from './consent';
import { sanitizePathWithAllowedQuery } from './url';

const ATTRIBUTION_STORAGE_KEY = 'mq-analytics-attribution-v1';

interface StoredAttribution {
  first_touch: SafeAttribution;
  last_touch: SafeAttribution;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readStoredAttribution(): StoredAttribution | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredAttribution;
  } catch {
    return null;
  }
}

function writeStoredAttribution(value: StoredAttribution): void {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
}

function getReferrerDomain(): string | null {
  if (!isBrowser() || !document.referrer) {
    return null;
  }

  try {
    return new URL(document.referrer).hostname;
  } catch {
    return null;
  }
}

function extractAttributionFromSearch(search: string): SafeAttribution | null {
  const params = new URLSearchParams(search);
  const hasUtm =
    params.has('utm_source') ||
    params.has('utm_medium') ||
    params.has('utm_campaign') ||
    params.has('utm_content') ||
    params.has('utm_term');
  const hasGclid = params.has('gclid');
  const hasFbclid = params.has('fbclid');

  if (!hasUtm && !hasGclid && !hasFbclid) {
    return null;
  }

  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    gclid_present: hasGclid,
    fbclid_present: hasFbclid,
    landing_page: isBrowser()
      ? sanitizePathWithAllowedQuery(window.location.pathname, search)
      : null,
    referrer_domain: getReferrerDomain(),
  };
}

export function captureAttributionFromUrl(
  consent: EffectiveConsent,
  search: string = isBrowser() ? window.location.search : ''
): void {
  if (!canPersistAttribution(consent)) {
    return;
  }

  const touch = extractAttributionFromSearch(search);
  if (!touch) {
    return;
  }

  const existing = readStoredAttribution();

  if (!existing) {
    writeStoredAttribution({
      first_touch: { ...touch, attribution_model: 'first_touch' },
      last_touch: { ...touch, attribution_model: 'last_touch' },
    });
    return;
  }

  writeStoredAttribution({
    first_touch: existing.first_touch,
    last_touch: { ...touch, attribution_model: 'last_touch' },
  });
}

export function getAttributionForEvent(
  model: 'first_touch' | 'last_touch' = 'last_touch'
): SafeAttribution | undefined {
  const stored = readStoredAttribution();
  if (!stored) {
    return undefined;
  }

  return stored[model === 'first_touch' ? 'first_touch' : 'last_touch'];
}

export function getAttributionForSubmission(): SafeAttribution | undefined {
  return getAttributionForEvent('last_touch');
}

export function clearAttribution(): void {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
}
