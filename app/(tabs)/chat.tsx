import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import Toast from 'react-native-toast-message';

export default function ChatScreen() {
  const { currentUser } = useAuth();
  const { rooms, isLoading, fetchRooms, createRoom } = useChat();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleCreateRoom = async () => {
    if (!currentUser || !roomName.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Enter a room name' });
      return;
    }

    try {
      setIsCreatingRoom(true);
      const roomId = await createRoom(roomName.trim(), 'group', [currentUser.uid]);
      setRoomName('');
      setShowCreateModal(false);
      Toast.show({ type: 'success', text1: 'Room Created!', text2: roomName.trim() });
      router.push(`/chat/${roomId}`);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to create room' });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-4 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Chats
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {rooms.length} conversation{rooms.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-primary-600 w-10 h-10 rounded-xl items-center justify-center shadow-md shadow-primary-200 dark:shadow-none"
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rooms List */}
      <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
        {isLoading && rooms.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-slate-400 mt-3 text-sm">Loading chats...</Text>
          </View>
        ) : rooms.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No Chats Yet"
            message="Tap + to create a new group chat and connect with classmates!"
          />
        ) : (
          rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              onPress={() => router.push(`/chat/${room.id}`)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-2.5 flex-row items-center border border-slate-100 dark:border-slate-800"
              activeOpacity={0.7}
            >
              {/* Room Icon */}
              <View className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 items-center justify-center mr-3">
                <Ionicons
                  name={room.type === 'group' ? 'people' : 'person'}
                  size={22}
                  color="#4F46E5"
                />
              </View>

              {/* Room Info */}
              <View className="flex-1 mr-2">
                <Text className="font-semibold text-slate-900 dark:text-white text-[15px]">
                  {room.name}
                </Text>
                <Text className="text-slate-400 dark:text-slate-500 text-sm mt-0.5" numberOfLines={1}>
                  {room.lastMessage || 'No messages yet'}
                </Text>
              </View>

              {/* Timestamp */}
              <View className="items-end">
                {room.lastMessageTime && (
                  <Text className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDistanceToNow(new Date(room.lastMessageTime), { addSuffix: false })}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Create Room Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
            className="flex-1 bg-black/30"
          />
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl px-5 pt-6 pb-10 border-t border-slate-100 dark:border-slate-800">
            <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full self-center mb-5" />
            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              New Group Chat
            </Text>

            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Room Name
            </Text>
            <TextInput
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base mb-5"
              placeholder="e.g., CSE Study Group"
              placeholderTextColor="#94A3B8"
              value={roomName}
              onChangeText={setRoomName}
            />

            <TouchableOpacity
              onPress={handleCreateRoom}
              disabled={isCreatingRoom}
              className="bg-primary-600 rounded-2xl py-4 items-center flex-row justify-center shadow-md shadow-primary-200 dark:shadow-none"
            >
              {isCreatingRoom ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-base ml-2">Create Room</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
