import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { SanityImage } from '@/types';

// Sanity client configuration
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});

// Image URL builder
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImage) {
  return builder.image(source);
}

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
