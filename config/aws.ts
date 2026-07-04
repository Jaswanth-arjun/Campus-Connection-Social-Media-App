import { S3Client } from '@aws-sdk/client-s3';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';

// AWS S3 Configuration for Campus Connect
// These values come from your .env file
const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'ap-south-1'; // Mumbai region (closest to India)
const AWS_ACCESS_KEY_ID = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || '';
const AWS_SESSION_TOKEN = process.env.EXPO_PUBLIC_AWS_SESSION_TOKEN || '';

export const S3_BUCKET_NAME = process.env.EXPO_PUBLIC_AWS_S3_BUCKET || 'campus-connect-storage';

// Initialize S3 Client using Fetch HTTP handler for React Native compatibility
export const s3Client = new S3Client({
  region: AWS_REGION,
  requestHandler: new FetchHttpHandler(),
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    ...(AWS_SESSION_TOKEN ? { sessionToken: AWS_SESSION_TOKEN } : {}),
  },
});

// Generate the public URL for an S3 object
export const getS3PublicUrl = (key: string): string => {
  return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};
