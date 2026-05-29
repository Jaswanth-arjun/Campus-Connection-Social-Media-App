import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

export const storageService = {
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      throw new Error(error.message || 'Image upload failed');
    }
  },

  async uploadFile(uri: string, path: string, fileName: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `${path}/${fileName}`);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      throw new Error(error.message || 'File upload failed');
    }
  },
};
