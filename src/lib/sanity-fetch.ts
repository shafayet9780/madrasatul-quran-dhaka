import { client, getClient } from './sanity';
import type { QueryParams } from '@sanity/client';

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
 * Fetch published content from Sanity with tag-based ISR.
 *
 * Tagged with `tags` so the /api/refresh route can invalidate via
 * `revalidateTag(tag, 'max')`. Callers omit `revalidate` and get the 60s default.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  try {
    return await client.fetch<T>(query, params, {
      next: {
        revalidate: getRevalidateTime(revalidate),
        tags,
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
  revalidate = 60,
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  preview?: boolean;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  const sanityClient = getClient(preview);

  try {
    return await sanityClient.fetch<T>(query, params, {
      next: preview
        ? { revalidate: 0 } // No caching in preview mode
        : { revalidate: getRevalidateTime(revalidate), tags },
    });
  } catch (error) {
    console.error('Sanity fetch error:', error);
    throw new Error(`Failed to fetch data: ${error}`);
  }
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
