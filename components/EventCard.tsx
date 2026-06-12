import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  currentUserId?: string;
  onRegister?: () => void;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  currentUserId,
  onRegister,
  className = '',
}) => {
  const isRegistered = currentUserId && event.registeredUsers.includes(currentUserId);

  const categoryColors: Record<string, string> = {
    Academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Workshop: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/event/${event.id}`)}
      activeOpacity={0.9}
      className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm mb-4 ${className}`}
    >
      <Image source={{ uri: event.imageUrl }} className="w-full h-40" resizeMode="cover" />
      
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="font-semibold text-lg text-gray-900 dark:text-white">{event.title}</Text>
            <View className={`px-2 py-1 rounded-full self-start mt-2 ${categoryColors[event.category]}`}>
              <Text className="text-xs font-medium">{event.category}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center mt-3 mb-2">
          <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
          <Text className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(event.date), 'MMM dd, yyyy • h:mm a')}
          </Text>
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="location-outline" size={16} color="#9CA3AF" />
          <Text className="ml-2 text-sm text-gray-600 dark:text-gray-400">{event.location}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {event.registeredUsers.length} registered
          </Text>
          
          <TouchableOpacity
            onPress={onRegister}
            className={`px-4 py-2 rounded-xl border ${
              isRegistered
                ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                : 'bg-[#6A2FF9]/10 border-[#6A2FF9]/20'
            }`}
          >
            <Text
              className={`font-extrabold ${
                isRegistered ? 'text-slate-600 dark:text-slate-400' : 'text-[#6A2FF9]'
              }`}
            >
              {isRegistered ? 'Registered' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
