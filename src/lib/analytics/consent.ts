import {
  CONSENT_STORAGE_KEY,
  type ConsentPreferences,
  type EffectiveConsent,
  type RegionBucket,
} from './types';
import { resolveRegionBucket } from './regions';

export function toConsentStorage(granted: boolean): 'granted' | 'denied' {
  return granted ? 'granted' : 'denied';
}

export function getDefaultConsentForRegion(region: RegionBucket): Omit<EffectiveConsent, 'region'> {
  if (region === 'general') {
    return {
      analytics: true,
      advertising: true,
      requiresOptIn: false,
    };
  }

  return {
    analytics: false,
    advertising: false,
    requiresOptIn: true,
  };
}

export function readStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.advertising !== 'boolean'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredConsent(preferences: Omit<ConsentPreferences, 'updatedAt'>): ConsentPreferences {
  const payload: ConsentPreferences = {
    ...preferences,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  }

  return payload;
}

export function getRegionFromCountry(countryCode: string | null | undefined): RegionBucket {
  return resolveRegionBucket(countryCode);
}

export function getEffectiveConsent(
  countryCode: string | null | undefined,
  stored: ConsentPreferences | null = readStoredConsent()
): EffectiveConsent {
  const region = getRegionFromCountry(countryCode);
  const defaults = getDefaultConsentForRegion(region);

  if (!stored) {
    return { region, ...defaults };
  }

  return {
    region,
    analytics: stored.analytics,
    advertising: stored.advertising,
    requiresOptIn: defaults.requiresOptIn,
  };
}

export function shouldLoadGtm(consent: EffectiveConsent): boolean {
  return consent.analytics || consent.advertising;
}

export function canPersistAttribution(consent: EffectiveConsent): boolean {
  return consent.analytics || consent.advertising;
}

export function acceptAllConsent(countryCode: string | null | undefined): EffectiveConsent {
  writeStoredConsent({ analytics: true, advertising: true });
  return getEffectiveConsent(countryCode);
}

export function rejectNonEssentialConsent(countryCode: string | null | undefined): EffectiveConsent {
  writeStoredConsent({ analytics: false, advertising: false });
  return getEffectiveConsent(countryCode);
}

export function updateConsentPreferences(
  countryCode: string | null | undefined,
  preferences: { analytics: boolean; advertising: boolean }
): EffectiveConsent {
  writeStoredConsent(preferences);
  return getEffectiveConsent(countryCode);
}
