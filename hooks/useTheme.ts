import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../store/authStore';

export const useTheme = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { currentUser, updateProfile } = useAuthStore();

  const userPreference = currentUser?.darkMode;
  const isDark = userPreference !== undefined ? userPreference : colorScheme === 'dark';

  // Sync NativeWind and system Appearance with user preference
  useEffect(() => {
    if (userPreference !== undefined) {
      const scheme = userPreference ? 'dark' : 'light';
      setColorScheme(scheme);
      Appearance.setColorScheme(scheme);
    }
  }, [userPreference]);

  const toggleDarkMode = async () => {
    if (currentUser) {
      const newDarkMode = !currentUser.darkMode;
      const scheme = newDarkMode ? 'dark' : 'light';
      
      // Immediately switch the appearance and NativeWind for instant feedback
      setColorScheme(scheme);
      Appearance.setColorScheme(scheme);
      
      await updateProfile({ darkMode: newDarkMode });
    }
  };

  return {
    colorScheme: colorScheme || 'light',
    isDark,
    toggleDarkMode,
  };
};
