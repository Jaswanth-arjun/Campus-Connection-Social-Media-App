import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuth = () => {
  const {
    currentUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    loadUser,
    setCurrentUser,
    setLoading
  } = useAuthStore();

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      setLoading(false);
      return;
    }

    // 1. Initial optimistic load from AsyncStorage (very fast, doesn't block Firebase check)
    const initApp = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          setCurrentUser(userData);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn('AsyncStorage read error on startup:', err);
        setLoading(false);
      }
    };
    initApp().catch((err) => {
      console.error('[Auth] initApp rejected:', err);
      setLoading(false);
    });

    // 2. Main Firebase authentication listener (the source of truth)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we already have the matching user in memory, don't re-fetch (avoids stale closures)
        const currentStoredUser = useAuthStore.getState().currentUser;
        if (currentStoredUser && currentStoredUser.uid === firebaseUser.uid) {
          setLoading(false);
          return;
        }

        try {
          // Check if user exists in AsyncStorage (fastest)
          const userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            if (userData.uid === firebaseUser.uid) {
              setCurrentUser(userData);
              return;
            }
          }

          // Otherwise, fetch fresh user data from Firestore
          const dbUser = await authService.getUser(firebaseUser.uid);
          if (dbUser) {
            await AsyncStorage.setItem('user', JSON.stringify(dbUser));
            setCurrentUser(dbUser);
          } else {
            // No profile in Firestore: clean up auth state
            await authService.logout();
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error synchronizing auth state:', err);
          setLoading(false);
        }
      } else {
        // Not authenticated
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser, setLoading]);

  return {
    currentUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    loadUser,
  };
};
