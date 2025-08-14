import { client } from './sanity';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImage } from '@/types/sanity';

/**
 * Media management utilities for Sanity CMS
 */

const builder = imageUrlBuilder(client);

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
  crop?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'focalpoint';
  blur?: number;
  sharpen?: number;
  auto?: 'format' | 'compress';
}

export interface ResponsiveImageSizes {
  mobile: ImageTransformOptions;
  tablet: ImageTransformOptions;
  desktop: ImageTransformOptions;
  xl?: ImageTransformOptions;
}

/**
 * Generate optimized image URL from Sanity image
 */
export function getOptimizedImageUrl(
  image: SanityImage,
  options: ImageTransformOptions = {}
): string {
  if (!image?.asset?._ref) {
    return '';
  }

  let urlBuilder = builder.image(image);

  // Apply transformations
  if (options.width) urlBuilder = urlBuilder.width(options.width);
  if (options.height) urlBuilder = urlBuilder.height(options.height);
  if (options.quality) urlBuilder = urlBuilder.quality(options.quality);
  if (options.format) urlBuilder = urlBuilder.format(options.format);
  if (options.fit) urlBuilder = urlBuilder.fit(options.fit);
  if (options.crop) urlBuilder = urlBuilder.crop(options.crop);
  if (options.blur) urlBuilder = urlBuilder.blur(options.blur);
  if (options.sharpen) urlBuilder = urlBuilder.sharpen(options.sharpen);
  if (options.auto) urlBuilder = urlBuilder.auto(options.auto);

  // Apply hotspot and crop if available
  if (image.hotspot) {
    urlBuilder = urlBuilder.focalPoint(image.hotspot.x, image.hotspot.y);
  }

  return urlBuilder.url();
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(
  image: SanityImage,
  sizes: ResponsiveImageSizes
): {
  mobile: string;
  tablet: string;
  desktop: string;
  xl?: string;
} {
  return {
    mobile: getOptimizedImageUrl(image, sizes.mobile),
    tablet: getOptimizedImageUrl(image, sizes.tablet),
    desktop: getOptimizedImageUrl(image, sizes.desktop),
    xl: sizes.xl ? getOptimizedImageUrl(image, sizes.xl) : undefined,
  };
}

/**
 * Generate srcSet string for responsive images
 */
export function generateSrcSet(
  image: SanityImage,
  widths: number[],
  options: Omit<ImageTransformOptions, 'width'> = {}
): string {
  if (!image?.asset?._ref) {
    return '';
  }

  return widths
    .map(width => {
      const url = getOptimizedImageUrl(image, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageRef: string): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
} | null> {
  try {
    const query = `*[_type == "sanity.imageAsset" && _id == $imageRef][0] {
      metadata {
        dimensions {
          width,
          height,
          aspectRatio
        },
        format,
        size
      }
    }`;

    const result = await client.fetch(query, { imageRef });
    
    if (!result?.metadata) {
      return null;
    }

    return {
      width: result.metadata.dimensions.width,
      height: result.metadata.dimensions.height,
      format: result.metadata.format,
      size: result.metadata.size,
      aspectRatio: result.metadata.dimensions.aspectRatio,
    };
  } catch (error) {
    console.error('Error fetching image metadata:', error);
    return null;
  }
}

/**
 * Upload image to Sanity
 */
export async function uploadImage(
  file: File,
  options: {
    filename?: string;
    title?: string;
    altText?: string;
    description?: string;
  } = {}
): Promise<SanityImage | null> {
  try {
    const asset = await client.assets.upload('image', file, {
      filename: options.filename || file.name,
      title: options.title,
      description: options.description,
    });

    return {
      _type: 'image',
      asset: {
        _ref: asset._id,
        _type: 'reference',
      },
      alt: options.altText || '',
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

/**
 * Delete image from Sanity
 */
export async function deleteImage(imageRef: string): Promise<boolean> {
  try {
    await client.delete(imageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Get unused images (images not referenced by any document)
 */
export async function getUnusedImages(): Promise<string[]> {
  try {
    // Get all image assets
    const allImages = await client.fetch(`
      *[_type == "sanity.imageAsset"] {
        _id
      }
    `);

    // Get all image references in documents
    const referencedImages = await client.fetch(`
      *[defined(featuredImage.asset._ref) || defined(images[].asset._ref) || defined(gallery[].asset._ref) || defined(photo.asset._ref) || defined(logo.asset._ref) || defined(favicon.asset._ref)] {
        "refs": [
          featuredImage.asset._ref,
          images[].asset._ref,
          gallery[].asset._ref,
          photo.asset._ref,
          logo.asset._ref,
          favicon.asset._ref
        ]
      }
    `);

    // Flatten referenced image IDs
    const referencedIds = new Set(
      referencedImages
        .flatMap((doc: any) => doc.refs)
        .filter(Boolean)
    );

    // Find unused images
    const unusedImages = allImages
      .filter((image: any) => !referencedIds.has(image._id))
      .map((image: any) => image._id);

    return unusedImages;
  } catch (error) {
    console.error('Error finding unused images:', error);
    return [];
  }
}

/**
 * Bulk delete unused images
 */
export async function cleanupUnusedImages(): Promise<{
  deleted: number;
  errors: string[];
}> {
  const unusedImages = await getUnusedImages();
  const errors: string[] = [];
  let deleted = 0;

  for (const imageId of unusedImages) {
    try {
      await client.delete(imageId);
      deleted++;
    } catch (error) {
      errors.push(`Failed to delete ${imageId}: ${error}`);
    }
  }

  return { deleted, errors };
}

/**
 * Optimize image for web delivery
 */
export function getWebOptimizedImageUrl(
  image: SanityImage,
  maxWidth = 1920,
  quality = 85
): string {
  return getOptimizedImageUrl(image, {
    width: maxWidth,
    quality,
    format: 'auto',
    auto: 'format',
  });
}

/**
 * Generate image placeholder (low quality image placeholder)
 */
export function getImagePlaceholder(
  image: SanityImage,
  width = 20,
  quality = 20
): string {
  return getOptimizedImageUrl(image, {
    width,
    quality,
    blur: 5,
    format: 'jpg',
  });
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate image gallery data structure
 */
export function createImageGallery(
  images: SanityImage[],
  options: {
    thumbnailSize?: ImageTransformOptions;
    fullSize?: ImageTransformOptions;
  } = {}
): Array<{
  id: string;
  thumbnail: string;
  full: string;
  alt: string;
  caption?: string;
}> {
  const defaultThumbnailOptions: ImageTransformOptions = {
    width: 300,
    height: 200,
    fit: 'crop',
    quality: 80,
    format: 'auto',
  };

  const defaultFullOptions: ImageTransformOptions = {
    width: 1200,
    quality: 90,
    format: 'auto',
  };

  return images.map((image, index) => ({
    id: image.asset._ref || `image-${index}`,
    thumbnail: getOptimizedImageUrl(image, {
      ...defaultThumbnailOptions,
      ...options.thumbnailSize,
    }),
    full: getOptimizedImageUrl(image, {
      ...defaultFullOptions,
      ...options.fullSize,
    }),
    alt: image.alt || '',
    caption: image.caption?.bengali || image.caption?.english || '',
  }));
}

/**
 * Common responsive image configurations
 */
export const RESPONSIVE_IMAGE_CONFIGS = {
  hero: {
    mobile: { width: 768, height: 400, fit: 'crop' as const, quality: 80 },
    tablet: { width: 1024, height: 500, fit: 'crop' as const, quality: 85 },
    desktop: { width: 1920, height: 600, fit: 'crop' as const, quality: 90 },
  },
  card: {
    mobile: { width: 300, height: 200, fit: 'crop' as const, quality: 80 },
    tablet: { width: 400, height: 250, fit: 'crop' as const, quality: 85 },
    desktop: { width: 500, height: 300, fit: 'crop' as const, quality: 90 },
  },
  gallery: {
    mobile: { width: 300, height: 300, fit: 'crop' as const, quality: 80 },
    tablet: { width: 400, height: 400, fit: 'crop' as const, quality: 85 },
    desktop: { width: 500, height: 500, fit: 'crop' as const, quality: 90 },
  },
  profile: {
    mobile: { width: 150, height: 150, fit: 'crop' as const, quality: 80 },
    tablet: { width: 200, height: 200, fit: 'crop' as const, quality: 85 },
    desktop: { width: 250, height: 250, fit: 'crop' as const, quality: 90 },
  },
} as const;