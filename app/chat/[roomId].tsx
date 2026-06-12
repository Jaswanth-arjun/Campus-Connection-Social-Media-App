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
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ChatBubble } from '../../components/ChatBubble';
import { EmptyState } from '../../components/EmptyState';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { activeRoom, messages, isLoading, sendMessage, sendMessageWithImage, sendMessageWithFile } = useChat(roomId as string);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !roomId) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessage(
        roomId as string,
        currentUser.uid,
        currentUser.name,
        currentUser.avatar || '',
        text
      );
    } catch (error: any) {
      setMessageText(text); // Restore on failure
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send message',
      });
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && currentUser && roomId) {
      try {
        setIsSending(true);
        await sendMessageWithImage(roomId as string, currentUser.uid, currentUser.name, currentUser.avatar || '', result.assets[0].uri);
        Toast.show({ type: 'success', text1: 'Image Sent', text2: 'Photo shared successfully' });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to send image',
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync();

    if (result.canceled === false && result.assets[0] && currentUser && roomId) {
      try {
        setIsSending(true);
        await sendMessageWithFile(roomId as string, currentUser.uid, currentUser.name, currentUser.avatar || '', result.assets[0].uri, result.assets[0].name);
        Toast.show({ type: 'success', text1: 'File Sent', text2: result.assets[0].name });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to send file',
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-darkBg"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3.5 bg-white dark:bg-darkSurface border-b border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-darkElevated items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="font-bold text-slate-900 dark:text-white text-base" numberOfLines={1}>
            {activeRoom?.name || 'Chat'}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500">
            {activeRoom?.members?.length || 0} member{(activeRoom?.members?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 items-center justify-center">
          <Ionicons
            name={activeRoom?.type === 'group' ? 'people' : 'person'}
            size={18}
            color={isDark ? '#A78BFA' : '#8B5CF6'}
          />
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {isLoading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-slate-400 mt-3 text-sm">Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-outline"
            title="No Messages Yet"
            message="Say hello and start the conversation! 👋"
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

      {/* Sending indicator */}
      {isSending && (
        <View className="flex-row items-center justify-center py-2 bg-purple-50 dark:bg-darkElevated">
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text className="text-purple-600 dark:text-purple-400 text-xs ml-2 font-medium">
            Uploading...
          </Text>
        </View>
      )}

      {/* Message Input */}
      <View className="bg-white dark:bg-darkSurface px-3 py-2.5 border-t border-slate-100 dark:border-white/[0.06]">
        <View className="flex-row items-end space-x-2">
          <TouchableOpacity
            onPress={handlePickImage}
            className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 items-center justify-center mb-0.5"
          >
            <Ionicons name="image" size={18} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickFile}
            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-darkElevated items-center justify-center mb-0.5"
          >
            <Ionicons name="attach" size={18} color={isDark ? '#A1A1AA' : '#64748B'} />
          </TouchableOpacity>

          <TextInput
            className="flex-1 bg-slate-50 dark:bg-darkElevated border border-slate-100 dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white"
            style={{ maxHeight: 100, fontSize: 15 }}
            placeholder="Message..."
            placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            className={`w-10 h-10 rounded-xl items-center justify-center mb-0.5 ${
              messageText.trim()
                ? 'bg-purple-600 dark:bg-purple-500 shadow-sm'
                : 'bg-slate-200 dark:bg-darkElevated'
            }`}
          >
            <Ionicons
              name="send"
              size={18}
              color={messageText.trim() ? '#FFFFFF' : (isDark ? '#4B5563' : '#94A3B8')}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
