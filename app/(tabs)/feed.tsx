import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';
import { PostCard } from '../../components/PostCard';
import { EmptyState } from '../../components/EmptyState';
import { UserAvatar } from '../../components/UserAvatar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../../components/SkeletonLoader';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { posts, isLoading, hasMore, createPost, likePost, unlikePost, searchPosts, fetchPosts, loadMore, deletePost } = usePosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    try {
      const post = posts.find((p) => p.id === postId);
      if (post && post.likes.includes(currentUser.uid)) {
        await unlikePost(postId, currentUser.uid);
      } else {
        await likePost(postId, currentUser.uid);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to post detail
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      if (Platform.OS === 'web') {
        alert('Post deleted successfully! 🎉');
      } else {
        Alert.alert('Deleted', 'Post deleted successfully! 🎉');
      }
    } catch (error: any) {
      const errMsg = error.message || 'Failed to delete post';
      if (Platform.OS === 'web') {
        alert('Error: ' + errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchPosts(searchQuery);
    } else {
      await fetchPosts(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPosts(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.25, // Highly compressed so it fits inside 1MB Firestore limit
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (result.assets[0].base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSelectedImage(base64Uri);
      } else {
        // Fallback for web or devices where base64 is missing
        try {
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error('Error fallback reading image base64:', e);
          setSelectedImage(result.assets[0].uri);
        }
      }
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });

    if (result.canceled === false && result.assets[0]) {
      if (Platform.OS === 'web') {
        try {
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedFile({ uri: reader.result as string, name: result.assets[0].name });
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error('Web file read error:', e);
        }
      } else {
        try {
          const FileSystem = require('expo-file-system');
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          let mimeType = 'application/octet-stream';
          if (result.assets[0].name.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
          else if (result.assets[0].name.toLowerCase().endsWith('.doc')) mimeType = 'application/msword';
          else if (result.assets[0].name.toLowerCase().endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

          const base64Uri = `data:${mimeType};base64,${base64}`;
          setSelectedFile({ uri: base64Uri, name: result.assets[0].name });
        } catch (error) {
          console.error('Error reading file as base64:', error);
          Alert.alert('Error', 'Failed to read selected file');
        }
      }
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;

    if (!content.trim() && !selectedImage && !selectedFile) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add some content',
      });
      return;
    }

    try {
      setIsCreating(true);
      await createPost(
        currentUser.uid,
        currentUser.name,
        currentUser.avatar || '',
        content,
        selectedImage || undefined,
        selectedFile?.uri || undefined,
        selectedFile?.name || undefined
      );

      setContent('');
      setSelectedImage(null);
      setSelectedFile(null);
      setShowCreateModal(false);

      if (Platform.OS === 'web') {
        alert('Posted! Your post is now live 🎉');
      } else {
        Alert.alert('Success', 'Your post is now live 🎉');
      }
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errMsg = error.message || 'Failed to create post';
      if (Platform.OS === 'web') {
        alert('Error: ' + errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  };

  return (
    <View className="flex-1 bg-themeBgLight">
      <StatusBar barStyle="dark-content" />

      {/* Premium Header */}
      <View 
        className="bg-white px-5 pb-4 border-b border-purple-100/70 shadow-md shadow-purple-950/5"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <View className="flex-row items-center justify-between mb-3.5">
          {currentUser ? (
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              className="flex-row items-center active:opacity-85"
            >
              <UserAvatar uri={currentUser.avatar} size={42} />
              <View className="ml-3">
                <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider leading-3">
                  Welcome back,
                </Text>
                <Text className="text-base font-extrabold text-slate-800 tracking-tight leading-4 mt-0.5">
                  {currentUser.name}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-[#6A2FF9] w-11 h-11 rounded-2xl items-center justify-center shadow-lg shadow-purple-900/10 active:opacity-90"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Inline Search */}
        <View className="flex-row items-center bg-slate-50 border border-purple-100/60 rounded-3xl px-4 py-2.5 shadow-inner">
          <Ionicons name="search" size={18} color="#6A2FF9" />
          <TextInput
            className="flex-1 text-slate-800 font-semibold text-sm ml-2.5 py-0.5"
            placeholder="Search posts, topics..."
            placeholderTextColor="#A78BFA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchPosts(true); }}>
              <Ionicons name="close-circle" size={18} color="#A78BFA" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Posts Feed */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 pt-4"

        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6A2FF9" />
        }
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {isLoading && posts.length === 0 ? (
          <SkeletonLoader type="post" count={3} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon="newspaper-outline"
            title="No Posts Yet"
            message="Be the first to share something with your campus community"
          />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.uid}
              onLike={() => handleLike(post.id)}
              onComment={() => handleComment(post.id)}
              onDelete={() => handleDeletePost(post.id)}
            />
          ))
        )}

        {isLoading && posts.length > 0 && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#6A2FF9" />
          </View>
        )}


        {/* Bottom padding for tab bar */}
        <View className="h-6" />
      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-slate-900"
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-slate-500 font-medium text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">New Post</Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={isCreating}
              className="bg-primary-600 px-5 py-2 rounded-xl shadow-sm"
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-sm">Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            {/* Author Row */}
            <View className="flex-row items-start mb-4">
              <UserAvatar uri={currentUser?.avatar} size={44} />
              <View className="ml-3">
                <Text className="font-semibold text-slate-900 dark:text-white text-base">
                  {currentUser?.name}
                </Text>
                <Text className="text-xs text-slate-400">Posting to Campus Feed</Text>
              </View>
            </View>

            <TextInput
              className="text-slate-900 dark:text-white text-base leading-6"
              style={{ minHeight: 120 }}
              placeholder="What's happening on campus?"
              placeholderTextColor="#94A3B8"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {selectedImage && (
              <View className="relative mb-4 mt-2">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-52 rounded-2xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5"
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {selectedFile && (
              <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-4 mt-2 flex-row items-center justify-between border border-slate-100 dark:border-slate-700">
                <View className="flex-row items-center flex-1">
                  <View className="bg-primary-50 dark:bg-primary-900 w-10 h-10 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="document" size={20} color="#4F46E5" />
                  </View>
                  <Text className="text-slate-700 dark:text-white text-sm flex-1" numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Toolbar */}
          <View className="flex-row items-center px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <TouchableOpacity onPress={handlePickImage} className="flex-row items-center mr-6 bg-primary-50 dark:bg-primary-950 px-4 py-2.5 rounded-xl">
              <Ionicons name="image" size={20} color="#4F46E5" />
              <Text className="ml-2 text-primary-600 dark:text-primary-400 font-medium text-sm">Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickFile} className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
              <Ionicons name="document-attach" size={20} color="#64748B" />
              <Text className="ml-2 text-slate-600 dark:text-slate-300 font-medium text-sm">File</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: any) {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
}
