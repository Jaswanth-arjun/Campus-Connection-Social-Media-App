import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/EmptyState';
import { formatDistanceToNow } from 'date-fns';

export default function ChatScreen() {
  const { currentUser } = useAuth();
  const { rooms, isLoading, fetchRooms } = useChat();

  useEffect(() => {
    if (currentUser) {
      fetchRooms(currentUser.uid);
    }
  }, [currentUser]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Chats</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {isLoading && rooms.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : rooms.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No Chats"
            message="Start a conversation with your campus community"
          />
        ) : (
          rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              onPress={() => router.push(`/chat/${room.id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
            >
              <View className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
                <Ionicons
                  name={room.type === 'group' ? 'people' : 'person'}
                  size={24}
                  color="#4F46E5"
                />
              </View>
              
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 dark:text-white">{room.name}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm" numberOfLines={1}>
                  {room.lastMessage || 'No messages yet'}
                </Text>
              </View>

              <View className="items-end">
                {room.lastMessageTime && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatDistanceToNow(new Date(room.lastMessageTime), { addSuffix: true })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-20 right-4 bg-primary-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
