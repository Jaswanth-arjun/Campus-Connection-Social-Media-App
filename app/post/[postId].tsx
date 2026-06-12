import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePostStore } from '../../store/postStore';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../../components/UserAvatar';
import { FileAttachment } from '../../components/FileAttachment';
import { formatDistanceToNow } from 'date-fns';
import Toast from 'react-native-toast-message';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { currentPost, currentPostComments, isLoading, fetchPost, fetchComments, likePost, unlikePost, addComment } = usePostStore();
  const [commentText, setCommentText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (postId && typeof postId === 'string') {
      fetchPost(postId);
      fetchComments(postId);
    }
  }, [postId]);

  useEffect(() => {
    if (currentPostComments.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [currentPostComments]);

  const handleLike = async () => {
    if (!currentUser || !currentPost) return;

    try {
      if (currentPost.likes.includes(currentUser.uid)) {
        await unlikePost(currentPost.id, currentUser.uid);
      } else {
        await likePost(currentPost.id, currentUser.uid);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to like post',
      });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || !currentPost) return;

    try {
      await addComment(currentPost.id, currentUser.uid, currentUser.name, currentUser.avatar, commentText.trim());
      setCommentText('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to add comment',
      });
    }
  };

  if (isLoading && !currentPost) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-darkBg">
        <ActivityIndicator size="large" color={isDark ? '#A78BFA' : '#8B5CF6'} />
      </View>
    );
  }

  if (!currentPost) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-darkBg">
        <Text className="text-gray-500 dark:text-slate-400">Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-darkBg"
    >
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-darkSurface border-b border-slate-100 dark:border-white/[0.06]">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#A78BFA' : '#8B5CF6'} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-900 dark:text-white">Post</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} className="flex-1">
        <View className="bg-white dark:bg-darkSurface p-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
          <View className="flex-row items-start mb-3">
            <UserAvatar uri={currentPost.authorAvatar} size={40} />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900 dark:text-white">{currentPost.authorName}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true })}
              </Text>
            </View>
          </View>

          <Text className="text-gray-900 dark:text-white mb-3 font-medium">{currentPost.content}</Text>

          {currentPost.imageUrl && (
            <Image
              source={{ uri: currentPost.imageUrl }}
              className="w-full h-64 rounded-lg mb-3"
              resizeMode="cover"
            />
          )}

          {currentPost.fileUrl && currentPost.fileName && (
            <FileAttachment fileName={currentPost.fileName} fileUrl={currentPost.fileUrl} className="mb-3" />
          )}

          <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <TouchableOpacity onPress={handleLike} className="flex-row items-center">
              <Ionicons
                name={currentPost.likes.includes(currentUser?.uid || '') ? 'heart' : 'heart-outline'}
                size={20}
                color={currentPost.likes.includes(currentUser?.uid || '') ? '#EF4444' : (isDark ? '#A1A1AA' : '#9CA3AF')}
              />
              <Text className="ml-2 text-slate-600 dark:text-slate-400">{currentPost.likes.length} likes</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
              <Text className="ml-2 text-slate-600 dark:text-slate-400">{currentPost.commentsCount} comments</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white dark:bg-darkSurface p-4 border-b border-slate-100 dark:border-white/[0.06]">
          <Text className="font-bold text-gray-900 dark:text-white mb-4">Comments</Text>

          {currentPostComments.length === 0 ? (
            <Text className="text-slate-500 dark:text-slate-400 text-center py-4">No comments yet</Text>
          ) : (
            currentPostComments.map((comment) => (
              <View key={comment.id} className="mb-4">
                <View className="flex-row items-start">
                  <UserAvatar uri={comment.authorAvatar} size={32} />
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-900 dark:text-white text-sm">{comment.authorName}</Text>
                    <Text className="text-gray-700 dark:text-slate-300 mt-1">{comment.text}</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View className="bg-white dark:bg-darkSurface px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
        <View className="flex-row items-center space-x-2">
          <UserAvatar uri={currentUser?.avatar} size={32} />
          <TextInput
            className="flex-1 bg-gray-100 dark:bg-darkElevated border border-slate-100 dark:border-white/[0.08] rounded-full px-4 py-2 text-gray-900 dark:text-white"
            placeholder="Add a comment..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!commentText.trim()}
            className="bg-purple-600 dark:bg-purple-500 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
