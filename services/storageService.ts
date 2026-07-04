import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME, getS3PublicUrl } from '../config/aws';
import * as FileSystem from 'expo-file-system';

// Fallback imports for Firebase Storage (used if AWS is not configured)
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Check if AWS S3 is configured by verifying credentials exist.
 */
const isS3Configured = (): boolean => {
  return !!(
    process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID &&
    process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY &&
    process.env.EXPO_PUBLIC_AWS_S3_BUCKET
  );
};

/**
 * Convert a local file URI to a Uint8Array for S3 upload.
 * Uses expo-file-system for reliable file reading in React Native.
 */
const fileToUint8Array = async (uri: string): Promise<{ data: Uint8Array; contentType: string }> => {
  // Read file as base64 using expo-file-system
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 to Uint8Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Detect content type from URI extension
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const contentTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  const contentType = contentTypeMap[extension] || 'application/octet-stream';
  return { data: bytes, contentType };
};

/**
 * Convert a local file URI to a Blob for Firebase Storage upload.
 */
const fileToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = function (e) {
      console.error('[StorageService] XHR error reading local file:', e);
      reject(new TypeError('Local file read request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

export const storageService = {
  /**
   * Upload an image to S3 (or Firebase Storage as fallback).
   * @param uri - Local file URI from image picker
   * @param path - Storage path (e.g., 'posts/1234567890')
   * @returns Public download URL of the uploaded image
   */
  async uploadImage(uri: string, path: string): Promise<string> {
    // --- AWS S3 Upload ---
    if (isS3Configured()) {
      try {
        const { data, contentType } = await fileToUint8Array(uri);
        const key = `${path}.${contentType.split('/')[1] || 'jpg'}`;

        const command = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Body: data,
          ContentType: contentType,
          // Make the object publicly readable
          ACL: 'public-read',
        });

        await s3Client.send(command);
        const publicUrl = getS3PublicUrl(key);
        console.log('[StorageService] S3 upload success:', publicUrl);
        return publicUrl;
      } catch (error: any) {
        console.error('[StorageService] S3 uploadImage error:', error);
        throw new Error(error.message || 'S3 image upload failed');
      }
    }

    // --- Firebase Storage Fallback ---
    try {
      const blob = await fileToBlob(uri);
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);

      if (typeof (blob as any).close === 'function') {
        (blob as any).close();
      }

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      console.error('[StorageService] Firebase uploadImage error:', error);
      throw new Error(error.message || 'Image upload failed');
    }
  },

  /**
   * Upload a file to S3 (or Firebase Storage as fallback).
   * @param uri - Local file URI
   * @param path - Storage directory path (e.g., 'chat/roomId')
   * @param fileName - Original file name
   * @returns Public download URL of the uploaded file
   */
  async uploadFile(uri: string, path: string, fileName: string): Promise<string> {
    // --- AWS S3 Upload ---
    if (isS3Configured()) {
      try {
        const { data, contentType } = await fileToUint8Array(uri);
        const key = `${path}/${fileName}`;

        const command = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Body: data,
          ContentType: contentType,
          ACL: 'public-read',
          // Set content disposition so files download with correct name
          ContentDisposition: `inline; filename="${fileName}"`,
        });

        await s3Client.send(command);
        const publicUrl = getS3PublicUrl(key);
        console.log('[StorageService] S3 file upload success:', publicUrl);
        return publicUrl;
      } catch (error: any) {
        console.error('[StorageService] S3 uploadFile error:', error);
        throw new Error(error.message || 'S3 file upload failed');
      }
    }

    // --- Firebase Storage Fallback ---
    try {
      const blob = await fileToBlob(uri);
      const storageRef = ref(storage, `${path}/${fileName}`);
      await uploadBytes(storageRef, blob);

      if (typeof (blob as any).close === 'function') {
        (blob as any).close();
      }

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      console.error('[StorageService] Firebase uploadFile error:', error);
      throw new Error(error.message || 'File upload failed');
    }
  },
};
