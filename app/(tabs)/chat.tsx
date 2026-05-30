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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-themeBgLight">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View 
        className="bg-white px-5 pb-4 border-b border-purple-100/70 shadow-md shadow-purple-950/5"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Chats
            </Text>
            <Text className="text-xs font-extrabold text-purple-400 mt-0.5">
              {rooms.length} conversation{rooms.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-[#6A2FF9] w-11 h-11 rounded-2xl items-center justify-center shadow-lg shadow-purple-900/10 active:opacity-90"
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rooms List */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading && rooms.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6A2FF9" />
            <Text className="text-purple-400 font-bold mt-3 text-sm">Loading chats...</Text>
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
              className="bg-white/70 rounded-3xl p-4 mb-3.5 flex-row items-center border border-purple-100/20 shadow-sm"
              activeOpacity={0.7}
            >
              {/* Room Icon */}
              <View className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100/40 items-center justify-center mr-3">
                <Ionicons
                  name={room.type === 'group' ? 'people' : 'person'}
                  size={22}
                  color="#6A2FF9"
                />
              </View>

              {/* Room Info */}
              <View className="flex-1 mr-2">
                <Text className="font-extrabold text-slate-800 text-[15px]">
                  {room.name}
                </Text>
                <Text className="text-purple-400 font-bold text-sm mt-0.5" numberOfLines={1}>
                  {room.lastMessage || 'No messages yet'}
                </Text>
              </View>

              {/* Timestamp */}
              <View className="items-end">
                {room.lastMessageTime && (
                  <Text className="text-xs font-extrabold text-purple-300">
                    {formatDistanceToNow(new Date(room.lastMessageTime), { addSuffix: false })}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color="#A78BFA" style={{ marginTop: 4 }} />
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
          <View className="bg-white rounded-t-[40px] px-6 pt-6 pb-10 border-t border-purple-100/30">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-5" />
            <Text className="text-2xl font-extrabold text-slate-900 mb-4">
              New Group Chat
            </Text>

            <Text className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-2">
              Room Name
            </Text>
            <TextInput
              className="bg-slate-50 border border-purple-100/60 rounded-2xl px-4 py-3.5 text-slate-800 font-bold text-base mb-5"
              placeholder="e.g., CSE Study Group"
              placeholderTextColor="#A78BFA"
              value={roomName}
              onChangeText={setRoomName}
            />

            <TouchableOpacity
              onPress={handleCreateRoom}
              disabled={isCreatingRoom}
              className="bg-[#6A2FF9] rounded-full py-4 items-center flex-row justify-center shadow-lg shadow-purple-900/10"
            >
              {isCreatingRoom ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text className="text-white font-extrabold text-base ml-2">Create Room</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

