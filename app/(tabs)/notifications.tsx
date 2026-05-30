import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuth } from '../../hooks/useAuth';
import { NotificationItem } from '../../components/NotificationItem';
import { EmptyState } from '../../components/EmptyState';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../../components/SkeletonLoader';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-themeBgLight">
      {/* Header */}
      <View 
        className="bg-white px-5 pb-4 border-b border-purple-100/70 shadow-md shadow-purple-950/5 flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            onPress={handleMarkAllAsRead}
            className="bg-purple-50 border border-purple-100 px-3.5 py-1.5 rounded-full active:opacity-80"
          >
            <Text className="text-[#6A2FF9] font-extrabold text-[13px]">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading && notifications.length === 0 ? (
          <SkeletonLoader type="notification" count={5} />
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
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}

