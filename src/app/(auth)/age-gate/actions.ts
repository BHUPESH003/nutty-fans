'use server';

import { ListObjectsV2Command } from '@aws-sdk/client-s3';

import { s3Client, BUCKET_NAME, CLOUDFRONT_URL } from '@/lib/storage/s3';

export async function getMosaicImages() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'mossaic/', // User specified 'mossaic' folder
      MaxKeys: 15, // We need 15 images for 3x5 grid
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    // Filter out the folder itself if it appears in the list
    const images = response.Contents.filter((item) => item.Key && item.Key !== 'mossaic/').map(
      (item) => {
        // Construct URL
        if (CLOUDFRONT_URL) {
          return `${CLOUDFRONT_URL}/${item.Key}`;
        }
        // Fallback to S3 URL if CloudFront is not configured
        // https://<bucket>.s3.<region>.amazonaws.com/<key>
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
