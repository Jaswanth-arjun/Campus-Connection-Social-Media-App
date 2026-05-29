import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppUpdates } from '../hooks/useAppUpdates';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadUser } = useAuth();
  const { isChecking, isDownloading } = useAppUpdates();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" redirect={!isAuthenticated} />
        <Stack.Screen name="(tabs)" redirect={isAuthenticated} />
      </Stack>
      <Toast />
    </>
  );
}
