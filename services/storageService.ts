import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      // Use XMLHttpRequest for robust local file blob conversion in React Native/Expo
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response as Blob);
        };
        xhr.onerror = function (e) {
          console.error('[StorageService] XHR error reading local file:', e);
          reject(new TypeError("Local file read request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      
      if (typeof (blob as any).close === 'function') {
        (blob as any).close();
      }

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      console.error('[StorageService] uploadImage error:', error);
      throw new Error(error.message || 'Image upload failed');
    }
  },

  async uploadFile(uri: string, path: string, fileName: string): Promise<string> {
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response as Blob);
        };
        xhr.onerror = function (e) {
          console.error('[StorageService] XHR error reading file:', e);
          reject(new TypeError("File read request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
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
      console.error('[StorageService] uploadFile error:', error);
      throw new Error(error.message || 'File upload failed');
    }
  },
};

