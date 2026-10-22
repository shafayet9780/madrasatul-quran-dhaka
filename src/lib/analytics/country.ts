// The visitor's country (from Vercel's x-vercel-ip-country), for the consent defaults (src/lib/analytics/regions.ts).
// The proxy copies it into a cookie, so pages read it in the browser and can be cached instead of reading the request.

export const COUNTRY_COOKIE = 'mq-country';

/** The country code the proxy left, or null (on the server, in local development, or before the first response). */
export function readCountryCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([A-Za-z]{2})(?:;|$)`));
  return match ? match[1].toUpperCase() : null;
}
