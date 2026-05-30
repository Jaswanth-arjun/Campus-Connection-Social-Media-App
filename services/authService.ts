import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocFromCache,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const createFallbackUser = (userId: string): User => {
  const firebaseUser = auth.currentUser;
  const email = firebaseUser?.email || '';
  const name = firebaseUser?.displayName || email.split('@')[0] || 'Campus User';

  return {
    uid: userId,
    name,
    email,
    avatar: firebaseUser?.photoURL || '',
    department: '',
    year: '',
    bio: '',
    fcmToken: '',
    createdAt: new Date(),
    darkMode: false,
    isAdmin: false,
  };
};

const normalizeUser = (userId: string, data: any): User => ({
  uid: userId,
  name: data?.name || data?.displayName || data?.email?.split?.('@')?.[0] || 'Campus User',
  email: data?.email || '',
  avatar: data?.avatar || data?.photoURL || '',
  department: data?.department || '',
  year: data?.year || '',
  bio: data?.bio || '',
  fcmToken: data?.fcmToken || '',
  createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt || new Date(),
  darkMode: Boolean(data?.darkMode),
  isAdmin: Boolean(data?.isAdmin),
});

export const authService = {
  async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  async register(email: string, password: string, name: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Send verification link to college email ID
      try {
        await sendEmailVerification(user);
      } catch (err) {
        console.warn('Failed to send verification email immediately:', err);
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        avatar: '',
        department: '',
        year: '',
        bio: '',
        fcmToken: '',
        createdAt: serverTimestamp(),
        darkMode: false,
        isAdmin: false,
      } as Omit<User, 'createdAt'> & { createdAt: any });

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  },

  async getUser(userId: string): Promise<User | null> {
    const fallbackUser = createFallbackUser(userId);
    let timeoutId: any;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Firestore fetch timeout')), 5000);
      });

      // Attempt to load from cache first for instant load
      try {
        const cacheDoc = await getDocFromCache(doc(db, 'users', userId));
        if (cacheDoc.exists()) {
          console.log('[Auth] Loaded user profile from offline cache');
          // Start a background server update without blocking the UI
          getDoc(doc(db, 'users', userId)).then(serverDoc => {
            if (serverDoc.exists()) {
              const freshData = serverDoc.data() as User;
              // Update AsyncStorage/store in the background
              AsyncStorage.setItem('user', JSON.stringify(freshData));
            }
          }).catch(e => console.log('[Auth] Background cache refresh failed:', e));

          clearTimeout(timeoutId);
          return normalizeUser(userId, cacheDoc.data());
        }
      } catch {
        console.log('[Auth] Profile not found in cache, fetching from server...');
      }

      // Fetch from server; if it is slow or unavailable, fall back to Auth data.
      const userDoc = await Promise.race([
        getDoc(doc(db, 'users', userId)),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);

      if (userDoc && userDoc.exists()) {
        const userData = normalizeUser(userId, userDoc.data());
        AsyncStorage.setItem('user', JSON.stringify(userData)).catch(() => undefined);
        return userData;
      }

      AsyncStorage.setItem('user', JSON.stringify(fallbackUser)).catch(() => undefined);
      return fallbackUser;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.warn('[Auth] getUser failed or timed out:', error.message);

      // Fallback: see if we have AsyncStorage user or Firebase Auth state as a last resort.
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          if (userData.uid === userId) {
            console.log('[Auth] Using AsyncStorage fallback');
            return normalizeUser(userId, userData);
          }
        }
      } catch {
        // Ignore AsyncStorage error
      }

      console.log('[Auth] Using Firebase Auth fallback');
      AsyncStorage.setItem('user', JSON.stringify(fallbackUser)).catch(() => undefined);
      return fallbackUser;
    }
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  async updateFCMToken(userId: string, token: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update FCM token');
    }
  },
};
