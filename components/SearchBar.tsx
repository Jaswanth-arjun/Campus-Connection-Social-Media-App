import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
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
    <View className={`flex-row items-center bg-white/70 border border-[#6A2FF9]/10 rounded-3xl px-4.5 py-3 shadow-sm ${className}`}>
      <Ionicons name="search" size={19} color="#6A2FF9" />
      <TextInput
        className="flex-1 ml-3 text-slate-800 font-medium text-sm"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A78BFA"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} className="pl-1">
          <Ionicons
            name="close-circle"
            size={18}
            color="#A78BFA"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

