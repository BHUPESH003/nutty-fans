import { S3Client } from '@aws-sdk/client-s3';

const region = process.env['AWS_REGION'] || 'us-east-1';
const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];

if (!accessKeyId || !secretAccessKey) {
  // Warn in development, throw in production?
  // For now, we'll just log a warning if missing, as the service might fail later.
  console.warn('Missing AWS credentials. S3 uploads will fail.');
}

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

export const BUCKET_NAME = process.env['AWS_S3_BUCKET'] || '';
export const CLOUDFRONT_URL = process.env['CLOUDFRONT_URL'] || '';
