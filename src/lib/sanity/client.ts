// Re-export from main sanity configuration to avoid duplication
export { client, previewClient, urlFor, getClient } from '../sanity';

// Additional helper functions specific to this client
import { urlFor } from '../sanity';
import type { SanityImage } from '@/types/sanity';

// Helper function to get optimized image URL
export function getImageUrl(
  image: SanityImage,
  width?: number,
  height?: number
): string {
  let url = urlFor(image);

  if (width) {
    url = url.width(width);
  }

  if (height) {
    url = url.height(height);
  }

  return url.format('webp').quality(85).url();
}
