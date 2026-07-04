import { uploadToS3 } from './s3Service';
import { Alert } from 'react-native';

// Fallback imports for Firebase Storage (used if AWS is not configured)
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Check if AWS S3 is configured by verifying credentials exist.
 */
const isS3Configured = (): boolean => {
  const isConfigured = !!(
    process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID &&
    process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY &&
    process.env.EXPO_PUBLIC_AWS_S3_BUCKET
  );
  return isConfigured;
};

/**
 * Detect content type from URI extension
 */
const getContentType = (uri: string): string => {
  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:([^;]+);/);
    if (match) {
      return match[1];
    }
  }
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
  return contentTypeMap[extension] || 'application/octet-stream';
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
    const isS3 = isS3Configured();
    
    // --- AWS S3 Upload ---
    if (isS3) {
      try {
        const contentType = getContentType(uri);
        const key = `${path}.${contentType.split('/')[1] || 'jpg'}`;

        const publicUrl = await uploadToS3({
          uri,
          bucket: process.env.EXPO_PUBLIC_AWS_S3_BUCKET!,
          key,
          region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
          accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.EXPO_PUBLIC_AWS_SESSION_TOKEN,
          contentType,
        });

        console.log('[StorageService] S3 upload success:', publicUrl);
        return publicUrl;
      } catch (error: any) {
        console.error('[StorageService] S3 uploadImage error:', error);
        Alert.alert('❌ S3 Image Upload Error', error.message || error.toString());
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
      Alert.alert('Firebase Image Fallback Error', error.message || error.toString());
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
    const isS3 = isS3Configured();
    
    // --- AWS S3 Upload ---
    if (isS3) {
      try {
        const contentType = getContentType(uri);
        const key = `${path}/${fileName}`;

        const publicUrl = await uploadToS3({
          uri,
          bucket: process.env.EXPO_PUBLIC_AWS_S3_BUCKET!,
          key,
          region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
          accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.EXPO_PUBLIC_AWS_SESSION_TOKEN,
          contentType,
        });

        console.log('[StorageService] S3 file upload success:', publicUrl);
        return publicUrl;
      } catch (error: any) {
        console.error('[StorageService] S3 uploadFile error:', error);
        Alert.alert('S3 File Upload Error', error.message || error.toString());
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
      Alert.alert('Firebase File Fallback Error', error.message || error.toString());
      throw new Error(error.message || 'File upload failed');
    }
  },

  /**
   * Delete a file from S3 or Firebase Storage based on its URL.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    const isS3Url = fileUrl.includes('.amazonaws.com');
    
    if (isS3Url) {
      if (isS3Configured()) {
        try {
          const urlParts = fileUrl.split('.amazonaws.com/');
          if (urlParts.length < 2) return;
          const key = decodeURIComponent(urlParts[1]);

          const { deleteFromS3 } = require('./s3Service');
          await deleteFromS3({
            bucket: process.env.EXPO_PUBLIC_AWS_S3_BUCKET!,
            key,
            region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
            accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.EXPO_PUBLIC_AWS_SESSION_TOKEN,
          });
          console.log('[StorageService] Successfully deleted S3 object:', key);
        } catch (error) {
          console.error('[StorageService] Failed S3 object deletion:', error);
        }
      }
    } else if (fileUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const { deleteObject, ref: storageRef } = require('firebase/storage');
        const fileRef = storageRef(storage, fileUrl);
        await deleteObject(fileRef);
        console.log('[StorageService] Successfully deleted Firebase Storage object:', fileUrl);
      } catch (error) {
        console.error('[StorageService] Failed Firebase Storage object deletion:', error);
      }
    }
  },
};
