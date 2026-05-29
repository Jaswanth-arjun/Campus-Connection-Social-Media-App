import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
  className?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  className = '',
}) => {
  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'post_like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'event':
        return 'calendar';
      case 'announcement':
        return 'megaphone';
      case 'message':
        return 'mail';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string): string => {
    switch (type) {
      case 'post_like':
        return '#EF4444';
      case 'comment':
        return '#3B82F6';
      case 'event':
        return '#10B981';
      case 'announcement':
        return '#F59E0B';
      case 'message':
        return '#8B5CF6';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-start p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${
        !notification.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''
      } ${className}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: getIconColor(notification.type) + '20' }}
      >
        <Ionicons
          name={getIcon(notification.type)}
          size={20}
          color={getIconColor(notification.type)}
        />
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-gray-900 dark:text-white">{notification.title}</Text>
        <Text className="text-gray-600 dark:text-gray-400 mt-1">{notification.body}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </Text>
      </View>

      {!notification.isRead && (
        <View className="w-2 h-2 rounded-full bg-primary-600 mt-2" />
      )}
    </TouchableOpacity>
  );
};
