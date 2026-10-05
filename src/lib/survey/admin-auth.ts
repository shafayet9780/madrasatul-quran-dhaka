import 'server-only';
import { headers } from 'next/headers';
import { getSiteUrl } from '@/lib/site-url';
import { isValidStudioAuthorization } from '@/lib/studio-auth';

/** Server actions on /admin repeat the proxy's Basic Auth check (production only, like /studio). */
export async function assertAdmin(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;
  if (!isValidStudioAuthorization((await headers()).get('authorization'))) throw new Error('Authentication required');
}

/** Origin the admin is browsing on, so copied links work on previews and locally too. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return getSiteUrl();
  const proto = h.get('x-forwarded-proto')?.split(',')[0].trim() ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}
