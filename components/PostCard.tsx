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
      className={`bg-white/75 rounded-3xl mb-4.5 shadow-xl shadow-purple-950/5 border border-white/30 overflow-hidden ${className}`}
    >
      {/* Author Header */}
      <View className="flex-row items-center px-4.5 pt-4.5 pb-2">
        <UserAvatar uri={post.authorAvatar} size={42} />
        <View className="flex-1 ml-3">
          <Text className="font-extrabold text-slate-900 text-[15px]">
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
            className="p-2 rounded-2xl bg-red-50 border border-red-100"
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.content ? (
        <Text className="text-slate-700 px-4.5 pb-3.5 text-[15px] leading-[22px] font-medium">
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

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap px-4.5 pb-2">
          {post.tags.map((tag, idx) => (
            <View key={idx} className="bg-purple-50 border border-purple-100/60 px-3 py-1 rounded-2xl mr-2 mb-1.5">
              <Text className="text-[#6A2FF9] text-[11px] font-extrabold">#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Bar */}
      <View className="flex-row items-center justify-between px-4.5 py-3 border-t border-[#6A2FF9]/5">
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

