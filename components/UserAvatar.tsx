import React, { useState } from 'react';
import { View, Image, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAvatarProps {
  uri?: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, size = 40, className = '' }) => {
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const [hasError, setHasError] = useState(false);

  const imageUri = (!uri || hasError) ? defaultAvatar : uri;

  const handleError = (_e: NativeSyntheticEvent<ImageErrorEventData>) => {
    if (!hasError) {
      setHasError(true);
    }
  };

  // Reset error state when uri changes (e.g. user updates their avatar)
  React.useEffect(() => {
    setHasError(false);
  }, [uri]);

  return (
    <View
      className={`rounded-full overflow-hidden bg-gray-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="w-full h-full"
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={handleError}
        />
      ) : (
        <View
          className="w-full h-full items-center justify-center bg-slate-200"
          style={{ width: size, height: size }}
        >
          <Ionicons name="person" size={size * 0.5} color="#94a3b8" />
        </View>
      )}
    </View>
  );
};
