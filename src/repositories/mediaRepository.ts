import { prisma } from '@/lib/db/prisma';
import type { MediaType, ProcessingStatus } from '@/types/content';

// Helper to convert BigInt to number for JSON serialization
function serializeMedia<T extends { fileSize?: bigint | number | null }>(
  media: T
): Omit<T, 'fileSize'> & { fileSize: number | null } {
  return {
    ...media,
    fileSize: media.fileSize ? Number(media.fileSize) : null,
  };
}

export class MediaRepository {
  /**
   * Create media record (pending upload)
   */
  async create(data: {
    creatorId: string;
    mediaType: MediaType;
    originalUrl: string;
    mimeType?: string;
    fileSize?: number;
    postId?: string;
  }) {
    const media = await prisma.media.create({
      data: {
        creatorId: data.creatorId,
        mediaType: data.mediaType,
        originalUrl: data.originalUrl,
        mimeType: data.mimeType ?? null,
        fileSize: data.fileSize ?? null,
        postId: data.postId ?? null,
        processingStatus: 'pending',
      },
    });
    return serializeMedia(media);
  }

  /**
   * Find media by ID
   */
  async findById(id: string) {
    const media = await prisma.media.findUnique({
      where: { id },
    });
    return media ? serializeMedia(media) : null;
  }

  /**
   * Find media by post ID
   */
  async findByPostId(postId: string) {
    const mediaList = await prisma.media.findMany({
      where: { postId },
      orderBy: { sortOrder: 'asc' },
    });
    return mediaList.map(serializeMedia);
  }

  /**
   * Update media after upload confirmed
   */
  async confirmUpload(
    id: string,
    data: {
      originalUrl: string;
      mimeType?: string;
      fileSize?: number;
      width?: number;
      height?: number;
    }
  ) {
    return prisma.media.update({
      where: { id },
      data: {
        originalUrl: data.originalUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        processingStatus: 'processing',
      },
    });
  }

  /**
   * Update processing status
   */
  async updateProcessingStatus(
    id: string,
    status: ProcessingStatus,
    processedData?: {
      processedUrl?: string;
      thumbnailUrl?: string;
      previewUrl?: string;
      urls?: Record<string, string>;
      duration?: number;
      width?: number;
      height?: number;
      metadata?: Record<string, unknown>;
    }
  ) {
    return prisma.media.update({
      where: { id },
      data: {
        processingStatus: status,
        ...(processedData?.processedUrl && { processedUrl: processedData.processedUrl }),
        ...(processedData?.thumbnailUrl && { thumbnailUrl: processedData.thumbnailUrl }),
        ...(processedData?.previewUrl && { previewUrl: processedData.previewUrl }),
        ...(processedData?.urls && { urls: processedData.urls }),
        ...(processedData?.duration && { duration: processedData.duration }),
        ...(processedData?.width && { width: processedData.width }),
        ...(processedData?.height && { height: processedData.height }),
        ...(processedData?.metadata && {
          metadata: JSON.parse(JSON.stringify(processedData.metadata)),
        }),
      },
    });
  }

  /**
   * Attach media to post
   */
  async attachToPost(mediaId: string, postId: string, sortOrder = 0) {
    return prisma.media.update({
      where: { id: mediaId },
      data: { postId, sortOrder },
    });
  }

  /**
   * Bulk attach media to post
   */
  async bulkAttachToPost(mediaIds: string[], postId: string) {
    const updates = mediaIds.map((id, index) =>
      prisma.media.update({
        where: { id },
        data: { postId, sortOrder: index },
      })
    );
    return prisma.$transaction(updates);
  }

  /**
   * Delete media
   */
  async delete(id: string) {
    return prisma.media.delete({
      where: { id },
    });
  }

  /**
   * Find pending media for creator (orphaned uploads)
   */
  async findPendingByCreator(creatorId: string, olderThan?: Date) {
    return prisma.media.findMany({
      where: {
        creatorId,
        postId: null,
        ...(olderThan && { createdAt: { lt: olderThan } }),
      },
    });
  }
}
