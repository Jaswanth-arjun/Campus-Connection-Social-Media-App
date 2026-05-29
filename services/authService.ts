import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from '../types';

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
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user');
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
