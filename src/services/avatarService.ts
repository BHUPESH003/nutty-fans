import { ProfileRepository } from '@/repositories/profileRepository';

type UploadUrlRequest = {
  fileName: string;
  fileSize: number;
  mimeType: string;
};

type UploadUrlResponse = {
  uploadUrl: string;
  assetKey: string;
  headers: Record<string, string>;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export class AvatarService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly profileRepo: ProfileRepository) {}

  validateFile(input: UploadUrlRequest): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      errors['mimeType'] = ['Please upload a JPG, PNG, GIF, or WebP image.'];
    }
    if (input.fileSize > MAX_AVATAR_BYTES) {
      errors['fileSize'] = ['Image must be under 5MB.'];
    }

    return errors;
  }

  async getUploadUrl(userId: string, input: UploadUrlRequest): Promise<UploadUrlResponse> {
    const errors = this.validateFile(input);
    if (Object.keys(errors).length > 0) {
      const error = new Error('Invalid avatar file');
      // @ts-expect-error attach structured details
      error.details = errors;
      throw error;
    }

    // For now, we fake an upload URL that points to a configurable storage origin.
    // A real implementation would use S3/Cloudflare/etc. client here.
    const baseUrl = process.env['AVATAR_UPLOAD_BASE_URL'] ?? '';
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const assetKey = `avatars/${userId}/${Date.now()}-${safeFileName}`;

    const uploadUrl = baseUrl
      ? `${baseUrl}/${assetKey}`
      : `https://storage.example.invalid/${assetKey}`;

    return {
      uploadUrl,
      assetKey,
      headers: {
        'Content-Type': input.mimeType,
      },
    };
  }

  async confirmAvatar(userId: string, assetKey: string): Promise<{ avatarUrl: string | null }> {
    // In a real implementation we would validate the assetKey against expected prefix and storage.
    const cdnBase = process.env['AVATAR_CDN_BASE_URL'] ?? '';
    const avatarUrl = cdnBase
      ? `${cdnBase}/${assetKey}`
      : `https://cdn.example.invalid/${assetKey}`;

    const updated = await this.profileRepo.updateAvatarUrl(userId, avatarUrl);
    return { avatarUrl: updated.avatarUrl ?? null };
  }

  async removeAvatar(userId: string): Promise<void> {
    await this.profileRepo.updateAvatarUrl(userId, null);
    // TODO: optionally call storage client to delete existing asset.
  }
}
