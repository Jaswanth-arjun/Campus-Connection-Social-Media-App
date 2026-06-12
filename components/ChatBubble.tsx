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
        className={`max-w-[70%] rounded-2xl px-4 py-3 border ${
          isOwn
            ? 'bg-[#6A2FF9]/15 dark:bg-[#8B5CF6]/20 border-[#6A2FF9]/25 dark:border-[#8B5CF6]/30 rounded-br-sm'
            : 'bg-slate-50 border-purple-100/50 dark:bg-darkSurface dark:border-white/[0.06] rounded-bl-sm'
        }`}
      >
        {!isOwn && (
          <Text className="text-xs font-semibold text-gray-700 dark:text-[#A78BFA] mb-1">
            {message.senderName}
          </Text>
        )}

        {message.type === 'text' && message.text && (
          <Text className={isOwn ? 'text-slate-900 dark:text-purple-100 font-medium' : 'text-gray-900 dark:text-white'}>
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
              isOwn ? 'text-purple-500 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </Text>
          {isOwn && (
            <Ionicons
              name={message.readBy.length > 1 ? 'checkmark-done' : 'checkmark'}
              size={14}
              color="#8B5CF6"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
};
