import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { ChatBubble } from '../../components/ChatBubble';
import { EmptyState } from '../../components/EmptyState';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { activeRoom, messages, isLoading, sendMessage, sendMessageWithImage, sendMessageWithFile, setActiveRoom } = useChat();
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (roomId && typeof roomId === 'string') {
      setActiveRoom({ id: roomId, name: '', type: 'group', members: [], lastMessage: '', lastMessageTime: new Date(), createdAt: new Date() });
    }
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !roomId) return;

    try {
      await sendMessage(
        roomId as string,
        currentUser.uid,
        currentUser.name,
        currentUser.avatar,
        messageText.trim()
      );
      setMessageText('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send message',
      });
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0] && currentUser && roomId) {
      try {
        await sendMessageWithImage(roomId as string, currentUser.uid, currentUser.name, currentUser.avatar, result.assets[0].uri);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to send image',
        });
      }
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync();

    if (result.canceled === false && result.assets[0] && currentUser && roomId) {
      try {
        await sendMessageWithFile(roomId as string, currentUser.uid, currentUser.name, currentUser.avatar, result.assets[0].uri, result.assets[0].name);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to send file',
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50 dark:bg-gray-950"
    >
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-semibold text-lg text-gray-900 dark:text-white">
          {activeRoom?.name || 'Chat'}
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
      >
        {isLoading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-outline"
            title="No Messages"
            message="Start the conversation!"
          />
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser?.uid}
            />
          ))
        )}
      </ScrollView>

      <View className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity onPress={handlePickImage}>
            <Ionicons name="image" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickFile}>
            <Ionicons name="document-attach" size={24} color="#4F46E5" />
          </TouchableOpacity>
          
          <TextInput
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-gray-900 dark:text-white"
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            className="bg-primary-600 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
