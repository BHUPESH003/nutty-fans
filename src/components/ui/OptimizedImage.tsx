'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

import {
  generateResponsiveImageUrls,
  generateSizesAttribute,
  isWebPSupported,
  getLoadingStrategy,
  generatePlaceholderUrl,
  type OptimizedImageUrls,
} from '@/lib/images/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
  sizes,
  objectFit = 'cover',
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [webpSupported, setWebpSupported] = useState(true);
  const [imageUrls, setImageUrls] = useState<OptimizedImageUrls | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check WebP support on client
    setWebpSupported(isWebPSupported());

    // Generate optimized URLs
    try {
      const optimized = generateResponsiveImageUrls(src);
      setImageUrls(optimized);
    } catch (err) {
      console.error('Failed to generate optimized image URLs:', err);
      setError(true);
    }
  }, [src]);

  // Fallback to original image if optimization fails
  if (error || !imageUrls) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
        fill={fill}
        sizes={sizes}
        style={{ objectFit }}
      />
    );
  }

  // Generate placeholder if needed
  const placeholderUrl =
    placeholder === 'blur' && blurDataURL
      ? blurDataURL
      : width && height
        ? generatePlaceholderUrl(width, height)
        : undefined;

  // Use WebP if supported, otherwise fallback to original
  const imageSrc = webpSupported && imageUrls.webp ? imageUrls.webp : imageUrls.original;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      fill={fill}
      sizes={sizes || generateSizesAttribute()}
      loading={getLoadingStrategy(priority)}
      placeholder={placeholder}
      blurDataURL={placeholderUrl}
      style={{ objectFit }}
      onError={() => {
        // Fallback to original if optimized version fails
        setError(true);
      }}
    />
  );
}
