import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FileAttachmentProps {
  fileName: string;
  fileUrl: string;
  className?: string;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({ fileName, fileUrl, className = '' }) => {
  const handleDownload = async () => {
    try {
      await Linking.openURL(fileUrl);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleDownload}
      className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-3 ${className}`}
    >
      <Ionicons name="document" size={24} color="#4F46E5" />
      <Text className="flex-1 ml-3 text-gray-900 dark:text-white" numberOfLines={1}>
        {fileName}
      </Text>
      <Ionicons name="download-outline" size={20} color="#4F46E5" />
    </TouchableOpacity>
  );
};
