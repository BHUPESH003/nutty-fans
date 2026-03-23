import type { MediaItem } from '@/types/content';

/**
 * CSS aspect ratio (width / height) for feed/profile/detail media.
 */
export function getMediaAspectRatio(
  media: MediaItem | undefined,
  variant: 'feed' | 'profile' | 'reels' | 'detail'
): number {
  if (!media) return 4 / 5;
  if (media.width && media.height && media.width > 0 && media.height > 0) {
    return media.width / media.height;
  }
  if (variant === 'reels') return 9 / 16;
  if (media.mediaType === 'video') return 9 / 16;
  return 4 / 5;
}
