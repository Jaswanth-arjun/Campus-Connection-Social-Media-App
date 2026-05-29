import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../types';
import { UserAvatar } from './UserAvatar';
import { FileAttachment } from './FileAttachment';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: () => void;
  onComment?: () => void;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  className = '',
}) => {
  const isLiked = currentUserId && post.likes.includes(currentUserId);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/post/${post.id}`)}
      activeOpacity={0.9}
      className={`bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-sm ${className}`}
    >
      <View className="flex-row items-start mb-3">
        <UserAvatar uri={post.authorAvatar} size={40} />
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900 dark:text-white">{post.authorName}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      <Text className="text-gray-900 dark:text-white mb-3">{post.content}</Text>

      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          className="w-full h-48 rounded-lg mb-3"
          resizeMode="cover"
        />
      )}

      {post.fileUrl && post.fileName && (
        <FileAttachment fileName={post.fileName} fileUrl={post.fileUrl} className="mb-3" />
      )}

      <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#EF4444' : '#9CA3AF'}
          />
          <Text className="ml-2 text-gray-600 dark:text-gray-400">{post.likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onComment}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
          <Text className="ml-2 text-gray-600 dark:text-gray-400">{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {}}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
