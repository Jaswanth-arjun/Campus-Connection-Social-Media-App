import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <View className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 ${className}`}>
      <Ionicons name="search" size={20} color="#9CA3AF" />
      <TextInput
        className="flex-1 ml-3 text-gray-900 dark:text-white"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={20}
          color="#9CA3AF"
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};
