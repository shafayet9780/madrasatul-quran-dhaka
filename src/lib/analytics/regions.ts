import type { RegionBucket } from './types';

/** EEA member states + UK + Switzerland — regulated opt-in bucket */
export const REGULATED_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
]);

/** Bangladesh and other non-regulated markets default to general bucket */
export function resolveRegionBucket(countryCode: string | null | undefined): RegionBucket {
  if (!countryCode || countryCode.trim() === '') {
    return 'unknown';
  }

  const code = countryCode.trim().toUpperCase();

  if (REGULATED_COUNTRY_CODES.has(code)) {
    return 'regulated';
  }

  return 'general';
}
