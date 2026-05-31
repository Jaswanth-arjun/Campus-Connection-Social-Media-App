import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyChwvHbhF9_i0aZlghiVLM5Mn9fToGaIt8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "campus-connection-652d7.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "campus-connection-652d7",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "campus-connection-652d7.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "472851754656",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:472851754656:web:a5654858c29932efe5a3c5",
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: any = null;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase app initialization error:', error);
}

if (app) {
  setLogLevel('error');

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fallback to getAuth if already initialized (common during hot-reloading)
    auth = getAuth(app);
  }

  try {
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase Firestore initialization error:', error);
  }

  try {
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase storage initialization error:', error);
  }
}

export { app, auth, db, storage, messaging };
