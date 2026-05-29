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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';
import { PostCard } from '../../components/PostCard';
import { EmptyState } from '../../components/EmptyState';
import { SearchBar } from '../../components/SearchBar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';

export default function FeedScreen() {
  const { currentUser } = useAuth();
  const { posts, isLoading, hasMore, createPost, likePost, unlikePost, searchPosts, fetchPosts } = usePosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchPosts(searchQuery);
    } else {
      await fetchPosts(true);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });

    if (result.canceled === false && result.assets[0]) {
      setSelectedFile({ uri: result.assets[0].uri, name: result.assets[0].name });
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;

    if (!content.trim() && !selectedImage && !selectedFile) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add content, image, or file',
      });
      return;
    }

    try {
      setIsCreating(true);
      await createPost(
        currentUser.uid,
        currentUser.name,
        currentUser.avatar,
        content,
        selectedImage || undefined,
        selectedFile?.uri,
        selectedFile?.name
      );
      setShowCreateModal(false);
      setContent('');
      setSelectedImage(null);
      setSelectedFile(null);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Post created successfully',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create post',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      // Load more posts
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search posts..."
          className="mb-2"
        />
        <TouchableOpacity onPress={handleSearch} className="bg-primary-600 rounded-lg py-2 items-center">
          <Text className="text-white font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            handleLoadMore();
          }
        }
        }
        scrollEventThrottle={400}
      >
        {isLoading && posts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
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
            />
          ))
        )}

        {isLoading && posts.length > 0 && (
          <View className="py-4">
            <ActivityIndicator size="small" color="#4F46E5" />
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => setShowCreateModal(true)}
        className="absolute bottom-20 right-4 bg-primary-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showCreateModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-gray-900"
        >
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">Create Post</Text>
            <TouchableOpacity onPress={handleCreatePost} disabled={isCreating}>
              <Text className="text-primary-600 font-semibold">Post</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="flex-row items-start mb-4">
              <View className="w-10 h-10 rounded-full bg-gray-300 mr-3" />
              <TextInput
                className="flex-1 text-gray-900 dark:text-white text-lg"
                placeholder="What's on your mind?"
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </View>

            {selectedImage && (
              <View className="relative mb-4">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-48 rounded-lg"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {selectedFile && (
              <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="document" size={24} color="#4F46E5" />
                  <Text className="ml-2 text-gray-900 dark:text-white" numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row space-x-4">
              <TouchableOpacity onPress={handlePickImage} className="flex-row items-center">
                <Ionicons name="image" size={24} color="#4F46E5" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePickFile} className="flex-row items-center">
                <Ionicons name="document-attach" size={24} color="#4F46E5" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">File</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: any) {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
}
