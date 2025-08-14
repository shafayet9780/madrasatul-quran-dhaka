'use client';

import Image from 'next/image';
import { useState } from 'react';
import { urlFor } from '@/lib/sanity';
import { SanityImage } from '@/types/sanity';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  image: SanityImage | string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  image,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate image URL based on type
  const getImageUrl = (targetWidth?: number, targetHeight?: number) => {
    if (typeof image === 'string') {
      return image;
    }

    let imageBuilder = urlFor(image);
    
    if (targetWidth) {
      imageBuilder = imageBuilder.width(targetWidth);
    }
    if (targetHeight) {
      imageBuilder = imageBuilder.height(targetHeight);
    }

    return imageBuilder
      .format('webp')
      .quality(quality)
      .url();
  };

  // Generate blur placeholder
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    if (typeof image === 'string') return undefined;

    return urlFor(image)
      .width(20)
      .height(20)
      .blur(50)
      .quality(20)
      .format('webp')
      .url();
  };

  // Generate responsive sizes if not provided
  const getResponsiveSizes = () => {
    if (sizes) return sizes;
    if (fill) return '100vw';
    
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Error fallback
  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          fill ? 'absolute inset-0' : '',
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageProps = {
    src: getImageUrl(width, height),
    alt,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      objectFit === 'cover' && 'object-cover',
      objectFit === 'contain' && 'object-contain',
      objectFit === 'fill' && 'object-fill',
      objectFit === 'none' && 'object-none',
      objectFit === 'scale-down' && 'object-scale-down',
      className
    ),
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    placeholder: placeholder as any,
    blurDataURL: getBlurDataURL(),
    loading: priority ? 'eager' : loading,
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        sizes={getResponsiveSizes()}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
      sizes={getResponsiveSizes()}
    />
  );
}

// Preset components for common use cases
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      priority
      sizes="100vw"
      quality={90}
    />
  );
}

export function CardImage(props: Omit<OptimizedImageProps, 'sizes' | 'objectFit'>) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      objectFit="cover"
    />
  );
}

export function GalleryImage(props: Omit<OptimizedImageProps, 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    />
  );
}

export function AvatarImage(props: Omit<OptimizedImageProps, 'sizes' | 'objectFit'>) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 640px) 96px, 128px"
      objectFit="cover"
    />
  );
}