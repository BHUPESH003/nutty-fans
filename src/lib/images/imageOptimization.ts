/**
 * Image Optimization Utilities
 *
 * Provides utilities for image optimization including:
 * - WebP conversion recommendations
 * - Responsive image size generation
 * - Lazy loading support
 * - CDN optimization
 */

export interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

export interface OptimizedImageUrls {
  original: string;
  webp?: string;
  sizes: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
  };
  srcSet?: string;
  webpSrcSet?: string;
}

/**
 * Standard image sizes for responsive images
 */
export const IMAGE_SIZES: ImageSize[] = [
  { width: 150, height: 150, suffix: 'thumb' },
  { width: 400, height: 400, suffix: 'small' },
  { width: 800, height: 800, suffix: 'medium' },
  { width: 1200, height: 1200, suffix: 'large' },
  { width: 1920, height: 1920, suffix: 'xlarge' },
];

/**
 * Generate responsive image URLs
 *
 * @param baseUrl Base URL of the image
 * @param sizes Array of image sizes to generate
 * @returns Optimized image URLs object
 */
export function generateResponsiveImageUrls(
  baseUrl: string,
  sizes: ImageSize[] = IMAGE_SIZES
): OptimizedImageUrls {
  const url = new URL(baseUrl);
  const basePath = url.pathname;
  const extension = basePath.split('.').pop() || 'jpg';
  const pathWithoutExt = basePath.replace(`.${extension}`, '');

  const optimized: OptimizedImageUrls = {
    original: baseUrl,
    sizes: {},
  };

  // Generate size variants
  for (const size of sizes) {
    const sizeUrl = `${url.origin}${pathWithoutExt}_${size.suffix}.${extension}`;
    optimized.sizes[size.suffix as keyof typeof optimized.sizes] = sizeUrl;
  }

  // Generate WebP variants
  const webpPath = `${pathWithoutExt}.webp`;
  optimized.webp = `${url.origin}${webpPath}`;

  // Generate srcSet for responsive images
  optimized.srcSet = sizes
    .map((size) => {
      const sizeUrl = `${url.origin}${pathWithoutExt}_${size.suffix}.${extension}`;
      return `${sizeUrl} ${size.width}w`;
    })
    .join(', ');

  optimized.webpSrcSet = sizes
    .map((size) => {
      const sizeUrl = `${url.origin}${pathWithoutExt}_${size.suffix}.webp`;
      return `${sizeUrl} ${size.width}w`;
    })
    .join(', ');

  return optimized;
}

/**
 * Get optimal image size based on viewport
 *
 * @param viewportWidth Viewport width in pixels
 * @returns Recommended image size suffix
 */
export function getOptimalImageSize(viewportWidth: number): string {
  if (viewportWidth <= 400) return 'small';
  if (viewportWidth <= 800) return 'medium';
  if (viewportWidth <= 1200) return 'large';
  return 'xlarge';
}

/**
 * Generate srcSet attribute for responsive images
 *
 * @param baseUrl Base URL of the image
 * @param sizes Array of image sizes
 * @returns srcSet string
 */
export function generateSrcSet(baseUrl: string, sizes: ImageSize[] = IMAGE_SIZES): string {
  const url = new URL(baseUrl);
  const basePath = url.pathname;
  const extension = basePath.split('.').pop() || 'jpg';
  const pathWithoutExt = basePath.replace(`.${extension}`, '');

  return sizes
    .map((size) => {
      const sizeUrl = `${url.origin}${pathWithoutExt}_${size.suffix}.${extension}`;
      return `${sizeUrl} ${size.width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 *
 * @returns sizes string for use in img tag
 */
export function generateSizesAttribute(): string {
  return '(max-width: 400px) 400px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1920px';
}

/**
 * Check if WebP is supported by the browser
 *
 * @param userAgent User agent string (optional)
 * @returns true if WebP is supported
 */
export function isWebPSupported(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: assume WebP is supported (modern browsers)
    return true;
  }

  // Client-side: check for WebP support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get image loading strategy
 *
 * @param priority Whether this image is above the fold
 * @returns 'eager' or 'lazy'
 */
export function getLoadingStrategy(priority: boolean = false): 'eager' | 'lazy' {
  return priority ? 'eager' : 'lazy';
}

/**
 * Generate placeholder image URL
 *
 * @param width Image width
 * @param height Image height
 * @param color Placeholder color (hex)
 * @returns Placeholder image URL
 */
export function generatePlaceholderUrl(
  width: number,
  height: number,
  color: string = 'e5e7eb'
): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23${color}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
  // Maximum image dimensions
  maxWidth: 1920,
  maxHeight: 1920,

  // Quality settings
  quality: {
    thumbnail: 70,
    small: 75,
    medium: 80,
    large: 85,
    xlarge: 90,
  },

  // Format priorities
  formats: ['webp', 'jpg', 'png'],

  // Lazy loading threshold (pixels from viewport)
  lazyLoadThreshold: 200,
};
