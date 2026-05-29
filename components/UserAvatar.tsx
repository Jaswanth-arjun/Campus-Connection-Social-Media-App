import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAvatarProps {
  uri?: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, size = 40, className = '' }) => {
  return (
    <View
      className={`rounded-full overflow-hidden bg-gray-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" style={{ width: size, height: size }} />
      ) : (
        <View className="w-full h-full items-center justify-center bg-gray-200">
          <Ionicons name="person" size={size * 0.5} color="#9CA3AF" />
        </View>
      )}
    </View>
  );
};
