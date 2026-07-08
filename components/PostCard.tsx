import React from 'react';
import { View, Text, Image, TouchableOpacity, Share, Platform, Alert } from 'react-native';
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
  onDelete?: () => void;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onDelete,
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

  const handleDelete = () => {
    if (onDelete) {
      if (Platform.OS === 'web') {
        const confirmDelete = window.confirm('Are you sure you want to delete this post?');
        if (confirmDelete) {
          onDelete();
        }
      } else {
        Alert.alert(
          'Delete Post',
          'Are you sure you want to delete this post permanently?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]
        );
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/post/${post.id}`)}
      activeOpacity={0.95}
      className={`bg-white/75 dark:bg-darkSurface/90 rounded-3xl mb-4.5 shadow-xl shadow-purple-950/5 dark:shadow-none border border-white/30 dark:border-white/[0.06] overflow-hidden ${className}`}
    >
      {/* Author Header */}
      <View className="flex-row items-center px-4.5 pt-4.5 pb-2">
        <UserAvatar uri={post.authorAvatar} size={42} />
        <View className="flex-1 ml-3">
          <Text className="font-extrabold text-slate-900 dark:text-white text-[15px]">
            {post.authorName}
          </Text>
          <Text className="text-xs font-semibold text-slate-400">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Text>
        </View>
        {currentUserId === post.authorId && onDelete && (
          <TouchableOpacity 
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-2 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20"
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.content ? (
        <Text className="text-slate-700 dark:text-slate-300 px-4.5 pb-3.5 text-[15px] leading-[22px] font-medium">
          {post.content}
        </Text>
      ) : null}

      {/* Image */}
      {post.imageUrl && (
        <View className="px-4.5 pb-3">
          <Image
            source={{ uri: post.imageUrl }}
            className="w-full h-56 rounded-2xl"
            resizeMode="cover"
          />
        </View>
      )}

      {/* File Attachment */}
      {post.fileUrl && post.fileName && (
        <View className="px-4.5 pb-3.5">
          <FileAttachment fileName={post.fileName} fileUrl={post.fileUrl} />
        </View>
      )}

      {/* Amazon Comprehend AI Insights (Sentiment + Language) */}
      {(post.sentiment || post.language) && (
        <View className="flex-row items-center px-4.5 pb-2 gap-2">
          {/* Sentiment Badge */}
          {post.sentiment && (
            <View
              className={`flex-row items-center px-2.5 py-1 rounded-2xl border ${
                post.sentiment === 'POSITIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                  : post.sentiment === 'NEGATIVE'
                  ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'
                  : post.sentiment === 'MIXED'
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20'
              }`}
            >
              <Text className="text-[11px] mr-0.5">
                {post.sentiment === 'POSITIVE' ? '😊' : post.sentiment === 'NEGATIVE' ? '😔' : post.sentiment === 'MIXED' ? '😐' : '🔵'}
              </Text>
              <Text
                className={`text-[10px] font-extrabold ${
                  post.sentiment === 'POSITIVE'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : post.sentiment === 'NEGATIVE'
                    ? 'text-red-600 dark:text-red-400'
                    : post.sentiment === 'MIXED'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {post.sentiment}
              </Text>
            </View>
          )}

          {/* Language Badge */}
          {post.language && (
            <View className="flex-row items-center bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-2xl">
              <Text className="text-[11px] mr-0.5">🌐</Text>
              <Text className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                {post.language}
              </Text>
            </View>
          )}

          {/* AI Badge */}
          <View className="flex-row items-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 px-2 py-1 rounded-2xl">
            <Text className="text-[10px] font-extrabold text-violet-500 dark:text-violet-400">✨ AI</Text>
          </View>
        </View>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap px-4.5 pb-2">
          {post.tags.map((tag, idx) => (
            <View key={idx} className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100/60 dark:border-white/[0.08] px-3 py-1 rounded-2xl mr-2 mb-1.5">
              <Text className="text-[#6A2FF9] dark:text-[#A78BFA] text-[11px] font-extrabold">#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Bar */}
      <View className="flex-row items-center justify-between px-4.5 py-3 border-t border-[#6A2FF9]/5 dark:border-white/[0.06]">
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={21}
            color={isLiked ? '#EF4444' : '#A78BFA'}
          />
          <Text className={`ml-1.5 text-sm font-extrabold ${isLiked ? 'text-red-500' : 'text-purple-400'}`}>
            {post.likes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onComment}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-outline" size={19} color="#A78BFA" />
          <Text className="ml-1.5 text-sm text-purple-400 font-extrabold">{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={19} color="#A78BFA" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

