import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
  const { currentUser, isLoading, isAuthenticated, login, register, logout, updateProfile, loadUser, setCurrentUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUser();
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    currentUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };
};
