import { urlFor } from '@/lib/sanity';
import { SanityImage } from '@/types/sanity';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  crop?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'entropy' | 'faces';
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
}

/**
 * Generate optimized image URL from Sanity image
 */
export function getOptimizedImageUrl(
  image: SanityImage,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 85,
    format = 'webp',
    blur,
    crop = 'center',
    fit = 'crop'
  } = options;

  let imageBuilder = urlFor(image);

  if (width) imageBuilder = imageBuilder.width(width);
  if (height) imageBuilder = imageBuilder.height(height);
  if (blur) imageBuilder = imageBuilder.blur(blur);

  return imageBuilder
    .format(format)
    .quality(quality)
    .fit(fit)
    .crop(crop)
    .url();
}

/**
 * Generate responsive image srcset for different screen sizes
 */
export function getResponsiveImageSrcSet(
  image: SanityImage,
  options: ImageOptimizationOptions = {}
): string {
  const { quality = 85, format = 'webp', crop = 'center', fit = 'crop' } = options;
  
  const sizes = [320, 640, 768, 1024, 1280, 1536, 1920];
  
  return sizes
    .map(size => {
      const url = urlFor(image)
        .width(size)
        .format(format)
        .quality(quality)
        .fit(fit)
        .crop(crop)
        .url();
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Generate blur placeholder data URL
 */
export function getBlurPlaceholder(image: SanityImage): string {
  return urlFor(image)
    .width(20)
    .height(20)
    .blur(50)
    .quality(20)
    .format('webp')
    .url();
}

/**
 * Presets for common image use cases
 */
export const imagePresets = {
  hero: {
    width: 1920,
    height: 1080,
    quality: 90,
    format: 'webp' as const,
  },
  card: {
    width: 400,
    height: 300,
    quality: 85,
    format: 'webp' as const,
  },
  gallery: {
    width: 800,
    height: 600,
    quality: 85,
    format: 'webp' as const,
  },
  thumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'webp' as const,
  },
  avatar: {
    width: 200,
    height: 200,
    quality: 85,
    format: 'webp' as const,
    crop: 'faces' as const,
  },
  banner: {
    width: 1200,
    height: 400,
    quality: 85,
    format: 'webp' as const,
  },
} as const;

/**
 * Get optimized image URL using preset
 */
export function getPresetImageUrl(
  image: SanityImage,
  preset: keyof typeof imagePresets
): string {
  return getOptimizedImageUrl(image, imagePresets[preset]);
}

/**
 * Generate meta tags for image optimization
 */
export function getImageMetaTags(image: SanityImage, alt: string) {
  const optimizedUrl = getOptimizedImageUrl(image, {
    width: 1200,
    height: 630,
    format: 'webp',
    quality: 90,
  });

  return {
    'og:image': optimizedUrl,
    'og:image:alt': alt,
    'og:image:width': '1200',
    'og:image:height': '630',
    'twitter:image': optimizedUrl,
    'twitter:image:alt': alt,
  };
}

/**
 * Check if image format is supported by browser
 */
export function isFormatSupported(format: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  } catch {
    return false;
  }
}

/**
 * Get best supported image format
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'jpg' {
  if (typeof window === 'undefined') return 'webp';
  
  if (isFormatSupported('avif')) return 'avif';
  if (isFormatSupported('webp')) return 'webp';
  return 'jpg';
}