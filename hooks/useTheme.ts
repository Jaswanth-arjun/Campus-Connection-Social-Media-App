import { useColorScheme } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { currentUser, updateProfile } = useAuthStore();
  
  const userPreference = currentUser?.darkMode;
  const colorScheme = userPreference !== undefined ? (userPreference ? 'dark' : 'light') : systemColorScheme;

  const toggleDarkMode = async () => {
    if (currentUser) {
      await updateProfile({ darkMode: !currentUser.darkMode });
    }
  };

  return {
    colorScheme,
    isDark: colorScheme === 'dark',
    toggleDarkMode,
  };
};
