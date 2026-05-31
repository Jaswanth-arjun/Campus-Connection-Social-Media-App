import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService, createFallbackUser } from '../services/authService';
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void (async () => {
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

            // Show a local fallback immediately, then refresh Firestore in the background.
            const fallbackUser = createFallbackUser(firebaseUser.uid);
            setCurrentUser(fallbackUser);

            void authService.getUser(firebaseUser.uid)
              .then(async (dbUser) => {
                if (dbUser) {
                  await AsyncStorage.setItem('user', JSON.stringify(dbUser));
                  setCurrentUser(dbUser);
                }
              })
              .catch((err) => {
                console.log('[Auth] Background user refresh failed:', err?.message || err);
              });
          } catch (err) {
            console.error('Error synchronizing auth state:', err);
            setLoading(false);
          }
        } else {
          // Not authenticated
          setCurrentUser(null);
        }
      })().catch((err) => {
        console.error('[Auth] auth state listener rejected:', err);
        setLoading(false);
      });
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
