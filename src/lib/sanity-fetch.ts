import { client, getClient } from './sanity';
import type { QueryParams } from '@sanity/client';
import { localOverrides } from './admissions/local';

/**
 * Get revalidation time based on environment.
 * In development, use 0 (no cache) to ensure fresh content; otherwise use the
 * provided revalidate time.
 */
function getRevalidateTime(revalidate: number | false): number | false {
  if (process.env.NODE_ENV === 'development') {
    return 0; // No cache in development
  }
  return revalidate;
}

/**
 * How long published content is kept (seconds). Publishing in the Studio refreshes it at once through the Sanity
 * webhook (/api/webhooks/sanity/revalidate, every fetch carries SANITY_TAG); the hour is the safety net. Each refresh
 * re-renders the page on Vercel (Active CPU, which the Hobby plan caps), so this was raised from 60 s.
 */
export const CONTENT_REVALIDATE = 3600;

/** Carried by every published fetch: the Sanity webhook refreshes them all on a publish. */
export const SANITY_TAG = 'sanity';

// Pages read Sanity's API, not its CDN: the webhook fires as soon as a publish commits, before the CDN may have the
// new version, and a page rebuilt from the old one would keep it for the hour. Next's cache absorbs the requests.
const published = () => client.withConfig({ useCdn: false });

/**
 * Fetch published content from Sanity with tag-based ISR.
 *
 * Tagged with `tags` (plus SANITY_TAG) so a webhook can invalidate them with `revalidateTag`. Callers omit
 * `revalidate` and get CONTENT_REVALIDATE.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = CONTENT_REVALIDATE,
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  // Admissions local preview (ADMISSIONS_LOCAL=1, never on Vercel): the site renders without Sanity.
  if (localOverrides()) return null as T;
  try {
    return await published().fetch<T>(query, params, {
      next: {
        revalidate: getRevalidateTime(revalidate),
        tags: [...tags, SANITY_TAG],
      },
    });
  } catch (error) {
    console.error('Sanity fetch error:', error);
    throw new Error(`Failed to fetch data: ${error}`);
  }
}

/**
 * Fetch data with preview support. In preview mode the draft client is used and
 * the read is never cached; otherwise it behaves like `sanityFetch`.
 */
export async function sanityFetchWithPreview<T>({
  query,
  params = {},
  preview = false,
  revalidate = CONTENT_REVALIDATE,
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  preview?: boolean;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  const sanityClient = preview ? getClient(true) : published();

  try {
    return await sanityClient.fetch<T>(query, params, {
      next: preview
        ? { revalidate: 0 } // No caching in preview mode
        : { revalidate: getRevalidateTime(revalidate), tags: [...tags, SANITY_TAG] },
    });
  } catch (error) {
    console.error('Sanity fetch error:', error);
    throw new Error(`Failed to fetch data: ${error}`);
  }
}

/**
 * Makes the page that calls it refresh by `at` (an admission form's opening or closing time) instead of keeping
 * its content for the full hour: a page is refreshed as soon as its shortest-lived fetch is. The query is a stand-in
 * that only carries that time.
 */
export async function refreshBy(at: Date | undefined, now: Date = new Date()): Promise<void> {
  if (!at || process.env.NODE_ENV === 'development' || localOverrides()) return;
  const seconds = Math.ceil((at.getTime() - now.getTime()) / 1000);
  if (seconds <= 0 || seconds >= CONTENT_REVALIDATE) return;
  // Best effort: if it fails, the page keeps its hour.
  await published().fetch('defined($at)', { at: at.toISOString() }, { next: { revalidate: Math.max(seconds, 60) } }).catch(() => undefined);
}

/**
 * Force a fresh, uncached read (e.g. manual refresh during development).
 */
export async function forceRefreshContent<T>({
  query,
  params = {},
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
}): Promise<T> {
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 0, tags },
    });
  } catch (error) {
    console.error('Sanity force refresh error:', error);
    throw new Error(`Failed to force refresh data: ${error}`);
  }
}

/**
 * Revalidate specific tags
 */
export function revalidateTags(tags: string[]) {
  // This would be used with Next.js revalidateTag function
  // Implementation depends on the specific Next.js setup
}

/**
 * Common error handler for Sanity operations
 */
export function handleSanityError(error: unknown): never {
  if (error instanceof Error) {
    throw new Error(`Sanity operation failed: ${error.message}`);
  }
  throw new Error('Unknown Sanity operation error');
}
