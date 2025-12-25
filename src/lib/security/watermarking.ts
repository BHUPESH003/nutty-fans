/**
 * Video Watermarking Utilities
 *
 * Generates dynamic watermark text for video playback
 * Contains: User ID, username, timestamp
 */

/**
 * Generate watermark text for video playback
 * Format: "nuttyfans.com | @username | user_[hash] | YYYY-MM-DD HH:MM"
 */
export function generateVideoWatermark(userId: string, username?: string | null): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  // Create a short hash of user ID (first 8 chars)
  const userHash = userId.slice(0, 8);
  const usernameDisplay = username ? `@${username}` : `user_${userHash}`;

  return `nuttyfans.com | ${usernameDisplay} | ${timestamp}`;
}

/**
 * Generate watermark text for image overlay
 * Same format as video
 */
export function generateImageWatermark(userId: string, username?: string | null): string {
  return generateVideoWatermark(userId, username);
}
