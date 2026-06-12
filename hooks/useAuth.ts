import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { authService, createFallbackUser, normalizeUser } from '../services/authService';
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

    let unsubscribeProfile: (() => void) | null = null;

    // 2. Main Firebase authentication listener (the source of truth)
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous profile listener if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        void (async () => {
          try {
            // Check if user exists in AsyncStorage (fastest, load optimistically first)
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
              const userData = JSON.parse(userJson);
              if (userData.uid === firebaseUser.uid) {
                setCurrentUser(userData);
              }
            } else {
              // Show a local fallback immediately if no cache exists
              const fallbackUser = createFallbackUser(firebaseUser.uid);
              setCurrentUser(fallbackUser);
            }

            // Always subscribe to real-time updates for the user profile document
            unsubscribeProfile = onSnapshot(
              doc(db, 'users', firebaseUser.uid),
              async (snapshot) => {
                if (snapshot.exists()) {
                  const userData = normalizeUser(firebaseUser.uid, snapshot.data());
                  await AsyncStorage.setItem('user', JSON.stringify(userData));
                  setCurrentUser(userData);
                } else {
                  // If doc does not exist (new user), use fallback and save it
                  const fallbackUser = createFallbackUser(firebaseUser.uid);
                  await AsyncStorage.setItem('user', JSON.stringify(fallbackUser));
                  setCurrentUser(fallbackUser);
                }
              },
              (error) => {
                console.warn('[Auth] Profile listener error:', error);
                // Fall back to AsyncStorage in case of permissions or offline errors
                AsyncStorage.getItem('user')
                  .then((userJson) => {
                    if (userJson) {
                      setCurrentUser(JSON.parse(userJson));
                    }
                  })
                  .catch(() => undefined);
              }
            );
          } catch (err) {
            console.error('Error synchronizing auth state:', err);
            setLoading(false);
          }
        })().catch((err) => {
          console.error('[Auth] auth state listener rejected:', err);
          setLoading(false);
        });
      } else {
        // Not authenticated
        setCurrentUser(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
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
