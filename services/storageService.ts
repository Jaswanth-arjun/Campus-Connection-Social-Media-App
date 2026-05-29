import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      // Robust React Native local URI to blob conversion using XMLHttpRequest
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      
      // We must close/release the blob to avoid memory leaks
      if (typeof (blob as any).close === 'function') {
        (blob as any).close();
      }

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      throw new Error(error.message || 'Image upload failed');
    }
  },

  async uploadFile(uri: string, path: string, fileName: string): Promise<string> {
    try {
      // Robust React Native local URI to blob conversion using XMLHttpRequest
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const storageRef = ref(storage, `${path}/${fileName}`);
      await uploadBytes(storageRef, blob);

      if (typeof (blob as any).close === 'function') {
        (blob as any).close();
      }
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      throw new Error(error.message || 'File upload failed');
    }
  },
};
