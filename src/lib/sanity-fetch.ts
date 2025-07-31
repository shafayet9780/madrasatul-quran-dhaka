import { client, getClient } from './sanity';
import type { QueryParams } from '@sanity/client';

/**
 * Fetch data from Sanity with error handling and caching
 */
export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60, // Cache for 60 seconds by default
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  try {
    const data = await client.fetch<T>(query, params, {
      next: {
        revalidate: revalidate === false ? false : revalidate,
        tags,
      },
    });
    return data;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    throw new Error(`Failed to fetch data: ${error}`);
  }
}

/**
 * Fetch data with preview support
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
    const data = await sanityClient.fetch<T>(query, params, {
      next: preview
        ? { revalidate: 0 } // No caching in preview mode
        : {
            revalidate: revalidate === false ? false : revalidate,
            tags,
          },
    });
    return data;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    throw new Error(`Failed to fetch data: ${error}`);
  }
}

/**
 * Revalidate specific tags
 */
export function revalidateTags(tags: string[]) {
  // This would be used with Next.js revalidateTag function
  // Implementation depends on the specific Next.js setup
  console.log('Revalidating tags:', tags);
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
