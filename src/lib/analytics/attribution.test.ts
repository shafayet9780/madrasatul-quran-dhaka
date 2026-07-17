import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  captureAttributionFromUrl,
  getAttributionForEvent,
  getAttributionForSubmission,
} from './attribution';
import type { EffectiveConsent } from './types';

const allowedConsent: EffectiveConsent = {
  region: 'general',
  analytics: true,
  advertising: true,
  requiresOptIn: false,
};

const deniedConsent: EffectiveConsent = {
  region: 'regulated',
  analytics: false,
  advertising: false,
  requiresOptIn: true,
};

describe('attribution persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('window', {
      location: {
        pathname: '/bengali/admissions',
        search: '',
      },
      sessionStorage,
      document: { referrer: 'https://facebook.com/page' },
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('does not persist when consent denies attribution', () => {
    captureAttributionFromUrl(deniedConsent, '?utm_source=google&utm_medium=cpc');
    expect(getAttributionForSubmission()).toBeUndefined();
  });

  it('persists first and last touch with boolean click IDs only', () => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/bengali/admissions',
        search:
          '?utm_source=facebook&utm_medium=paid&gclid=secret-gclid&fbclid=secret-fbclid&email=test@example.com',
      },
      sessionStorage,
      document: { referrer: 'https://facebook.com/page' },
    });

    captureAttributionFromUrl(
      allowedConsent,
      '?utm_source=facebook&utm_medium=paid&gclid=secret-gclid&fbclid=secret-fbclid'
    );

    const lastTouch = getAttributionForSubmission();
    expect(lastTouch?.utm_source).toBe('facebook');
    expect(lastTouch?.gclid_present).toBe(true);
    expect(lastTouch?.fbclid_present).toBe(true);
    expect((lastTouch as Record<string, unknown>).gclid).toBeUndefined();
    expect((lastTouch as Record<string, unknown>).fbclid).toBeUndefined();
    expect(lastTouch?.landing_page).toBe(
      '/bengali/admissions?utm_source=facebook&utm_medium=paid'
    );
    expect(lastTouch?.landing_page).not.toContain('secret-gclid');
    expect(lastTouch?.landing_page).not.toContain('secret-fbclid');
    expect(lastTouch?.landing_page).not.toContain('test@example.com');

    captureAttributionFromUrl(allowedConsent, '?utm_source=google&utm_medium=cpc');
    const firstTouch = getAttributionForEvent('first_touch');
    expect(firstTouch?.utm_source).toBe('facebook');
    expect(getAttributionForEvent('last_touch')?.utm_source).toBe('google');
  });
});
