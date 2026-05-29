import React from 'react';
import { View, Text, Image, TouchableOpacity, Share } from 'react-native';
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.authorName}: ${post.content}\n\n— Campus Connect`,
      });
    } catch (_) {}
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/post/${post.id}`)}
      activeOpacity={0.95}
      className={`bg-white dark:bg-slate-900 rounded-2xl mb-3 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden ${className}`}
    >
      {/* Author Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <UserAvatar uri={post.authorAvatar} size={40} />
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-slate-900 dark:text-white text-[15px]">
            {post.authorName}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content ? (
        <Text className="text-slate-800 dark:text-slate-200 px-4 pb-3 text-[15px] leading-[22px]">
          {post.content}
        </Text>
      ) : null}

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          className="w-full h-56"
          resizeMode="cover"
        />
      )}

      {/* File Attachment */}
      {post.fileUrl && post.fileName && (
        <View className="px-4 pb-3">
          <FileAttachment fileName={post.fileName} fileUrl={post.fileUrl} />
        </View>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap px-4 pb-2">
          {post.tags.map((tag, idx) => (
            <View key={idx} className="bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-lg mr-1.5 mb-1">
              <Text className="text-primary-600 dark:text-primary-400 text-xs font-medium">#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-t border-slate-50 dark:border-slate-800">
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={21}
            color={isLiked ? '#EF4444' : '#94A3B8'}
          />
          <Text className={`ml-1.5 text-sm font-medium ${isLiked ? 'text-red-500' : 'text-slate-400'}`}>
            {post.likes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onComment}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-outline" size={19} color="#94A3B8" />
          <Text className="ml-1.5 text-sm text-slate-400 font-medium">{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={19} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
