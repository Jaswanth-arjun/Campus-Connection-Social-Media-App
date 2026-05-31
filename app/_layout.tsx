// @ts-ignore
import '../global.css';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAppUpdates } from '../hooks/useAppUpdates';

export default function RootLayout() {
  const { isChecking, isDownloading } = useAppUpdates();

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
