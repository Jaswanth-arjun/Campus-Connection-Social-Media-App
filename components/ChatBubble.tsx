import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '../types';
import { FileAttachment } from './FileAttachment';
import { UserAvatar } from './UserAvatar';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn, className = '' }) => {
  return (
    <View
      className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}
    >
      {!isOwn && (
        <View className="mr-2">
          <UserAvatar
            uri={message.senderAvatar}
            size={32}
          />
        </View>
      )}
      
      <View
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwn
            ? 'bg-primary-600 rounded-br-sm'
            : 'bg-gray-200 dark:bg-gray-700 rounded-bl-sm'
        }`}
      >
        {!isOwn && (
          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {message.senderName}
          </Text>
        )}

        {message.type === 'text' && message.text && (
          <Text className={isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}>
            {message.text}
          </Text>
        )}

        {message.type === 'image' && message.fileUrl && (
          <Image
            source={{ uri: message.fileUrl }}
            className="w-48 h-48 rounded-lg"
            resizeMode="cover"
          />
        )}

        {message.type === 'file' && message.fileUrl && message.fileName && (
          <FileAttachment fileName={message.fileName} fileUrl={message.fileUrl} />
        )}

        <View className="flex-row items-center justify-end mt-1">
          <Text
            className={`text-xs ${
              isOwn ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </Text>
          {isOwn && (
            <Ionicons
              name={message.readBy.length > 1 ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={isOwn ? '#C7D2FE' : '#9CA3AF'}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
};
