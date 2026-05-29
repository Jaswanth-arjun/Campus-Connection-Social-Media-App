import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuth } from '../../hooks/useAuth';
import { NotificationItem } from '../../components/NotificationItem';
import { EmptyState } from '../../components/EmptyState';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const { currentUser } = useAuth();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.uid);
    }
  }, [currentUser]);

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'post_like':
      case 'comment':
        router.push(`/post/${notification.referenceId}`);
        break;
      case 'event':
        router.push(`/event/${notification.referenceId}`);
        break;
      case 'message':
        router.push(`/chat/${notification.referenceId}`);
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser) {
      await markAllAsRead(currentUser.uid);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text className="text-primary-600 font-medium">Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1">
        {isLoading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="No Notifications"
            message="You're all caught up!"
          />
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
