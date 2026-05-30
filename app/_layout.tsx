// @ts-ignore
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppUpdates } from '../hooks/useAppUpdates';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadUser } = useAuth();
  const { isChecking, isDownloading } = useAppUpdates();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-themeBg">
        <View className="w-24 h-24 bg-white/30 rounded-3xl items-center justify-center border border-white/40 mb-6 shadow-2xl shadow-purple-950/10 rotate-12">
          <Ionicons name="school" size={48} color="#6A2FF9" className="-rotate-12" />
        </View>
        <Text className="text-purple-950 font-black text-xl mb-4 tracking-tight">Campus Connect</Text>
        <ActivityIndicator size="large" color="#6A2FF9" />
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
