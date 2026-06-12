import { useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { currentUser, updateProfile } = useAuthStore();

  const userPreference = currentUser?.darkMode;
  const isDark = userPreference !== undefined ? userPreference : systemColorScheme === 'dark';

  // Sync Appearance with user preference so NativeWind dark: classes work
  useEffect(() => {
    if (userPreference !== undefined) {
      Appearance.setColorScheme(userPreference ? 'dark' : 'light');
    }
  }, [userPreference]);

  const toggleDarkMode = async () => {
    if (currentUser) {
      const newDarkMode = !currentUser.darkMode;
      // Immediately switch the system appearance for instant visual feedback
      Appearance.setColorScheme(newDarkMode ? 'dark' : 'light');
      await updateProfile({ darkMode: newDarkMode });
    }
  };

  return {
    colorScheme: isDark ? 'dark' : 'light',
    isDark,
    toggleDarkMode,
  };
};
