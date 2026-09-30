export const DEFAULT_SITE_URL = 'https://madrasatulquranbd.com';

/** Keep public metadata on the production origin when local previews override env. */
export function getSiteUrl(): string {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
      return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}
