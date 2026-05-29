import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: any = null;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    // Only initialize messaging on native platforms (crashes on web without service worker)
    if (Platform.OS !== 'web') {
      try {
        const { getMessaging } = require('firebase/messaging');
        messaging = getMessaging(app);
      } catch (e) {
        console.warn('Firebase messaging not available:', e);
      }
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  if (Platform.OS !== 'web') {
    try {
      const { getMessaging } = require('firebase/messaging');
      messaging = getMessaging(app);
    } catch (e) {
      console.warn('Firebase messaging not available:', e);
    }
  }
}

export { app, auth, db, storage, messaging };
