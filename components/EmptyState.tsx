import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name={icon} size={64} color="#9CA3AF" />
      <Text className="text-xl font-semibold text-gray-600 dark:text-gray-400 mt-4">{title}</Text>
      {message && (
        <Text className="text-gray-500 dark:text-gray-500 text-center mt-2">{message}</Text>
      )}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
};
