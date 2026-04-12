import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';
import {
  generateCloudFrontSignedUrl,
  extractS3KeyFromCloudFrontUrl,
} from '@/lib/storage/cloudfront';
import { PostService } from '@/services/content/postService';

const postService = new PostService();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const viewerUserId = session?.user?.id as string | undefined;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: { message: 'Media ID is required' } }, { status: 400 });
  }

  const media = await prisma.media.findUnique({
    where: { id },
    select: {
      id: true,
      postId: true,
      mediaType: true,
      originalUrl: true,
      metadata: true,
    },
  });

  if (!media) {
    return NextResponse.json({ error: { message: 'Media not found' } }, { status: 404 });
  }

  if (!media.postId) {
    return NextResponse.json(
      { error: { message: 'Media is not attached to a post' } },
      { status: 404 }
    );
  }

  // Enforce access control server-side.
  const access = await postService.checkAccess(media.postId, viewerUserId);
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: { message: 'Access denied', code: 'ACCESS_DENIED' } },
      { status: 403 }
    );
  }

  const metadata = media.metadata as unknown;
  const metadataObj =
    metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  // Extract S3 key from metadata or originalUrl
  let s3Key = typeof metadataObj['s3Key'] === 'string' ? (metadataObj['s3Key'] as string) : null;

  // Backward compatibility: older uploads might not have s3Key stored in metadata.
  // If originalUrl is a CloudFront URL pointing to the object, strip the prefix.
  if (!s3Key && media.originalUrl) {
    s3Key = extractS3KeyFromCloudFrontUrl(media.originalUrl);
  }

  if (!s3Key) {
    return NextResponse.json(
      { error: { message: 'Signed URL not available for this media' } },
      { status: 400 }
    );
  }

  // Generate CloudFront signed URL (domain-restricted, time-limited)
  // For subscriber-only content: 1 hour expiry
  // For public content: can use unsigned CloudFront URLs
  const signedUrl = generateCloudFrontSignedUrl(s3Key, 3600); // 1 hour

  return NextResponse.json({
    signedUrl,
    expiresIn: 3600,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
}
