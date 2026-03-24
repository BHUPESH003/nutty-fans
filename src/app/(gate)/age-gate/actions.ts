'use server';

import { ListObjectsV2Command } from '@aws-sdk/client-s3';

import { s3Client, BUCKET_NAME, CLOUDFRONT_URL } from '@/lib/storage/s3';

export async function getMosaicImages() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'mossaic/',
      MaxKeys: 15,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    const images = response.Contents.filter((item) => item.Key && item.Key !== 'mossaic/').map(
      (item) => {
        if (CLOUDFRONT_URL) {
          return `${CLOUDFRONT_URL}/${item.Key}`;
        }
        const region = process.env['AWS_REGION'] || 'us-east-1';
        return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${item.Key}`;
      }
    );

    return images;
  } catch (error) {
    console.error('Failed to fetch mosaic images:', error);
    return [];
  }
}
