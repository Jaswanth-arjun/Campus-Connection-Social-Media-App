// @ts-ignore
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppUpdates } from '../hooks/useAppUpdates';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadUser } = useAuth();
  const { isChecking, isDownloading } = useAppUpdates();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast />
    </>
  );
}
