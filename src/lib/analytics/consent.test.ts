import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  acceptAllConsent,
  getEffectiveConsent,
  getRegionFromCountry,
  rejectNonEssentialConsent,
  shouldLoadGtm,
  writeStoredConsent,
} from './consent';
import { CONSENT_STORAGE_KEY } from './types';

describe('consent resolver', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('maps Bangladesh to general bucket with defaults allowed', () => {
    const consent = getEffectiveConsent('BD');
    expect(consent.region).toBe('general');
    expect(consent.analytics).toBe(true);
    expect(consent.advertising).toBe(true);
    expect(shouldLoadGtm(consent)).toBe(true);
  });

  it('maps EEA countries to regulated bucket with defaults denied', () => {
    const consent = getEffectiveConsent('DE');
    expect(consent.region).toBe('regulated');
    expect(consent.analytics).toBe(false);
    expect(consent.advertising).toBe(false);
    expect(consent.requiresOptIn).toBe(true);
    expect(shouldLoadGtm(consent)).toBe(false);
  });

  it('uses an unknown opt-in bucket for missing country hints', () => {
    expect(getRegionFromCountry(null)).toBe('unknown');
    const consent = getEffectiveConsent(null);
    expect(consent.region).toBe('unknown');
    expect(consent.analytics).toBe(false);
  });

  it('uses stored preferences over defaults', () => {
    writeStoredConsent({ analytics: true, advertising: false });
    const consent = getEffectiveConsent('DE');
    expect(consent.analytics).toBe(true);
    expect(consent.advertising).toBe(false);
    expect(shouldLoadGtm(consent)).toBe(true);
  });

  it('accept and reject helpers persist preferences', () => {
    acceptAllConsent('BD');
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || '{}').analytics).toBe(true);

    rejectNonEssentialConsent('BD');
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || '{}');
    expect(stored.analytics).toBe(false);
    expect(stored.advertising).toBe(false);
  });
});
