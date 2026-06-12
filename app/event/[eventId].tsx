import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { currentEvent, isLoading, fetchEvent, registerForEvent, unregisterForEvent } = useEventStore();

  useEffect(() => {
    if (eventId && typeof eventId === 'string') {
      fetchEvent(eventId);
    }
  }, [eventId]);

  const handleRegister = async () => {
    if (!currentUser || !currentEvent) return;

    const isRegistered = currentEvent.registeredUsers.includes(currentUser.uid);

    Alert.alert(
      isRegistered ? 'Unregister from Event' : 'Register for Event',
      isRegistered ? 'Are you sure you want to unregister from this event?' : 'Do you want to register for this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isRegistered ? 'Unregister' : 'Register',
          onPress: async () => {
            try {
              if (isRegistered) {
                await unregisterForEvent(currentEvent.id, currentUser.uid);
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Unregistered from event',
                });
              } else {
                await registerForEvent(currentEvent.id, currentUser.uid);
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Registered for event',
                });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to update registration',
              });
            }
          },
        },
      ]
    );
  };

  if (isLoading && !currentEvent) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-darkBg">
        <ActivityIndicator size="large" color={isDark ? '#A78BFA' : '#8B5CF6'} />
      </View>
    );
  }

  if (!currentEvent) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-darkBg">
        <Text className="text-gray-500 dark:text-slate-400">Event not found</Text>
      </View>
    );
  }

  const isRegistered = currentUser && currentEvent.registeredUsers.includes(currentUser.uid);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-darkBg">
      <Image source={{ uri: currentEvent.imageUrl }} className="w-full h-56" resizeMode="cover" />

      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-darkSurface border-b border-slate-100 dark:border-white/[0.06]">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#A78BFA' : '#8B5CF6'} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-900 dark:text-white">Event Details</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>

      <View className="bg-white dark:bg-darkSurface p-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{currentEvent.title}</Text>
            <View className="bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-full self-start mt-2">
              <Text className="text-purple-600 dark:text-purple-300 text-sm font-semibold">{currentEvent.category}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center mt-4 mb-2">
          <Ionicons name="calendar-outline" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          <Text className="ml-2 text-gray-700 dark:text-slate-300">
            {format(new Date(currentEvent.date), 'MMMM dd, yyyy • h:mm a')}
          </Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          <Text className="ml-2 text-gray-700 dark:text-slate-300">{currentEvent.location}</Text>
        </View>

        <View className="flex-row items-center mb-4">
          <Ionicons name="person-outline" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          <Text className="ml-2 text-gray-700 dark:text-slate-300">
            {currentEvent.registeredUsers.length} registered
          </Text>
        </View>

        <View className="border-t border-slate-100 dark:border-white/[0.06] pt-4">
          <Text className="font-bold text-gray-900 dark:text-white mb-2">Description</Text>
          <Text className="text-gray-700 dark:text-slate-300">{currentEvent.description}</Text>
        </View>
      </View>

      <View className="bg-white dark:bg-darkSurface p-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <Text className="font-bold text-gray-900 dark:text-white mb-3">Organizer</Text>
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 items-center justify-center">
            <Ionicons name="person" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          </View>
          <Text className="ml-3 text-gray-900 dark:text-white font-medium">{currentEvent.organizer}</Text>
        </View>
      </View>

      <View className="p-4">
        <TouchableOpacity
          onPress={handleRegister}
          className={`py-4 rounded-xl items-center ${
            isRegistered
              ? 'bg-slate-200 dark:bg-darkElevated'
              : 'bg-[#8B5CF6] active:opacity-90 shadow-lg shadow-purple-500/20'
          }`}
        >
          <Text
            className={`font-semibold text-lg ${
              isRegistered ? 'text-slate-600 dark:text-slate-300' : 'text-white'
            }`}
          >
            {isRegistered ? 'Unregister' : 'Register Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
