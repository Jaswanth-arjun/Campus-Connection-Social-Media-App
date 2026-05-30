import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAvatarProps {
  uri?: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, size = 40, className = '' }) => {
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  return (
    <View
      className={`rounded-full overflow-hidden bg-gray-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        source={{ uri: uri || defaultAvatar }}
        className="w-full h-full"
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
};
