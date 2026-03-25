import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';
import { s3Client, BUCKET_NAME, CLOUDFRONT_URL } from '@/lib/storage/s3';
import { PostService } from '@/services/content/postService';

const postService = new PostService();
const SIGNED_URL_EXPIRATION_SECONDS = 300; // 5 minutes

function ensureNoTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

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

  let s3Key = typeof metadataObj['s3Key'] === 'string' ? (metadataObj['s3Key'] as string) : null;

  // Backward compatibility: older uploads might not have s3Key stored in metadata.
  // If originalUrl is a CloudFront URL pointing to the object, strip the prefix.
  if (!s3Key && media.originalUrl && CLOUDFRONT_URL) {
    const normalized = media.originalUrl;
    const prefix = `${ensureNoTrailingSlash(CLOUDFRONT_URL)}/`;
    if (normalized.startsWith(prefix)) {
      s3Key = normalized.slice(prefix.length);
    }
  }

  if (!s3Key) {
    return NextResponse.json(
      { error: { message: 'Signed URL not available for this media' } },
      { status: 400 }
    );
  }

  if (!BUCKET_NAME) {
    return NextResponse.json(
      { error: { message: 'Storage bucket not configured' } },
      { status: 500 }
    );
  }

  const signedUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
    { expiresIn: SIGNED_URL_EXPIRATION_SECONDS }
  );

  return NextResponse.json({
    signedUrl,
    expiresIn: SIGNED_URL_EXPIRATION_SECONDS,
    expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRATION_SECONDS * 1000).toISOString(),
  });
}
