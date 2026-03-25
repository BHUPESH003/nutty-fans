import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { prisma } from '@/lib/db/prisma';

type JsonRecord = Record<string, unknown>;

function clampTeaserDuration(seconds: number) {
  const n = Number(seconds);
  if (Number.isNaN(n)) return 5;
  return Math.max(3, Math.min(10, n));
}

function ensureNoDoubleSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function safeJsonObject(value: unknown): JsonRecord {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as JsonRecord;
  return {};
}

function runFfmpegTrim(inputUrl: string, durationSeconds: number, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    // Note: -c copy is fast, but may require keyframes for accurate trimming.
    // This matches the MVP requirement while keeping processing cost lower.
    const args = [
      '-y',
      '-ss',
      '0',
      '-t',
      String(durationSeconds),
      '-i',
      inputUrl,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    const proc = spawn('ffmpeg', args, { stdio: 'ignore' });

    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

export class TeaserPreviewService {
  private readonly s3Client: S3Client;
  private readonly awsBucket: string;
  private readonly cdnUrl: string;

  constructor() {
    const AWS_REGION = process.env['AWS_REGION'] ?? 'us-east-1';
    this.awsBucket = process.env['AWS_S3_BUCKET'] ?? '';
    const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'] ?? '';
    const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'] ?? '';
    this.cdnUrl = process.env['CLOUDFRONT_URL'] ?? '';

    this.s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async generateTeaserPreviews(opts?: { limit?: number }) {
    const limit = opts?.limit ?? 10;

    const publishedPosts = await prisma.post.findMany({
      where: { status: 'published' },
      take: 50,
      include: {
        media: {
          where: { mediaType: 'video' },
          select: {
            id: true,
            creatorId: true,
            mediaType: true,
            originalUrl: true,
            previewUrl: true,
            processingStatus: true,
            thumbnailUrl: true,
            duration: true,
            metadata: true,
          },
        },
        creator: {
          select: { id: true },
        },
      },
    });

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const post of publishedPosts) {
      if (processed >= limit) break;

      const pc = safeJsonObject(post.previewConfig as unknown);
      const type = pc['type'];
      if (type !== 'teaser') continue;

      const teaserDuration = clampTeaserDuration(Number(pc['teaserDuration'] ?? 5));

      const postMedia = post.media ?? [];
      for (const m of postMedia) {
        if (processed >= limit) break;
        processed += 1;

        try {
          // If we already have an mp4 teaser, skip.
          const current = m.previewUrl?.toLowerCase() ?? '';
          if (current.includes('.mp4')) continue;
          if (m.processingStatus !== 'completed') continue;

          const metadata = safeJsonObject(m.metadata);
          const s3Key =
            typeof metadata['s3Key'] === 'string' ? (metadata['s3Key'] as string) : null;

          // Create a time-limited URL for ffmpeg to read from S3.
          let inputUrl: string | null = null;
          if (s3Key && this.awsBucket) {
            const getCmd = new GetObjectCommand({ Bucket: this.awsBucket, Key: s3Key });
            inputUrl = await getSignedUrl(this.s3Client, getCmd, { expiresIn: 3600 });
          } else if (m.originalUrl && m.originalUrl !== 'locked') {
            inputUrl = m.originalUrl;
          }

          if (!inputUrl) throw new Error('Missing teaser input URL (S3 key/originalUrl)');

          const tmpDir = os.tmpdir();
          const outputFile = `${m.id}_teaser_${teaserDuration}s.mp4`;
          const outputPath = path.join(tmpDir, outputFile);

          // Generate (trim from start for MVP).
          await runFfmpegTrim(inputUrl, teaserDuration, outputPath);

          const outputKey = `previews/${m.creatorId}/${m.id}/teaser-${teaserDuration}s.mp4`;
          const putCmd = new PutObjectCommand({
            Bucket: this.awsBucket,
            Key: outputKey,
            Body: fs.createReadStream(outputPath),
            ContentType: 'video/mp4',
          });
          await this.s3Client.send(putCmd);

          const cdn = ensureNoDoubleSlash(this.cdnUrl);
          const outputUrl = `${cdn}/${outputKey}`;

          const nextMetadata = {
            ...metadata,
            teaserGeneratedAt: new Date().toISOString(),
            teaserDuration,
            teaserOutputKey: outputKey,
          };

          await prisma.media.update({
            where: { id: m.id },
            data: {
              previewUrl: outputUrl,
              metadata: nextMetadata,
            },
          });

          // Cleanup temp file best-effort.
          fs.unlink(outputPath, () => {});

          succeeded += 1;
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : 'Unknown teaser generation error';
          errors.push(`post:${post.id} media:${m.id} -> ${message}`);
        }
      }
    }

    return { processed, succeeded, failed, errors };
  }
}
