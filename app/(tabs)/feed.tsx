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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { onOpenComposer } from '../../utils/composeBus';
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
import { useStoryStore } from '../../store/storyStore';
import { Story } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import * as ScreenCapture from 'expo-screen-capture';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { compose } = useLocalSearchParams();

  const { posts, isLoading, hasMore, createPost, likePost, unlikePost, searchPosts, fetchPosts, loadMore, deletePost } = usePosts();

  // Story/Snap Store & State
  const { stories, subscribeToStories, createStory, viewStory, unsubscribe } = useStoryStore();
  const [viewerStoriesGroups, setViewerStoriesGroups] = useState<Story[][]>([]);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const storyScrollRef = useRef<ScrollView>(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  React.useEffect(() => {
    subscribeToStories();
    return () => {
      unsubscribe();
    };
  }, []);

  // Screen capture prevention when viewing stories
  React.useEffect(() => {
    if (activeUserIndex !== null) {
      ScreenCapture.preventScreenCaptureAsync().catch((err) => {
        console.warn('Failed to prevent screen capture:', err);
      });
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch((err) => {
        console.warn('Failed to allow screen capture:', err);
      });
    }
  }, [activeUserIndex]);

  // Mark current story as viewed
  React.useEffect(() => {
    if (activeUserIndex !== null && viewerStoriesGroups[activeUserIndex] && viewerStoriesGroups[activeUserIndex][activeStoryIndex] && currentUser) {
      const currentStory = viewerStoriesGroups[activeUserIndex][activeStoryIndex];
      viewStory(currentStory.id, currentUser.uid);
    }
  }, [activeUserIndex, activeStoryIndex, viewerStoriesGroups, currentUser]);

  // Programmatic scroll of outer ScrollView on activeUserIndex change
  React.useEffect(() => {
    if (activeUserIndex !== null && storyScrollRef.current) {
      const { width: W } = Dimensions.get('window');
      storyScrollRef.current.scrollTo({
        x: activeUserIndex * W,
        animated: true,
      });
    }
  }, [activeUserIndex]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');

  React.useEffect(() => {
    const unsub = onOpenComposer(() => setShowCreateModal(true));
    return unsub;
  }, []);
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
    try {
      if (searchQuery.trim()) {
        await searchPosts(searchQuery);
      } else {
        await fetchPosts(true);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Search failed';
      if (Platform.OS === 'web') {
        alert('Error: ' + errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
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

  const handleAddStory = async () => {
    if (!currentUser) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          alert('Camera permission is required to take snaps.');
        } else {
          Alert.alert('Permission Denied', 'Camera permission is required to take snaps.');
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.25,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        let base64Uri = '';
        if (result.assets[0].base64) {
          base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        } else {
          try {
            const res = await fetch(result.assets[0].uri);
            const blob = await res.blob();
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                base64Uri = reader.result as string;
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error('Error fallback reading camera base64:', e);
            base64Uri = result.assets[0].uri;
          }
        }

        if (base64Uri) {
          Toast.show({
            type: 'info',
            text1: 'Uploading Pulse...',
            text2: 'Sharing with the campus',
          });
          await createStory(
            currentUser.uid,
            currentUser.name,
            currentUser.avatar || '',
            base64Uri
          );
          Toast.show({
            type: 'success',
            text1: 'Pulse Shared! 📸',
            text2: 'Your pulse is active for 24 hours',
          });
        }
      }
    } catch (error: any) {
      console.error('Error adding story:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Could not post pulse',
      });
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  };

  // If route contains ?compose=1, open the create modal immediately
  React.useEffect(() => {
    if (compose === '1') {
      setShowCreateModal(true);
    }
  }, [compose]);

  // Group active stories by userId for feed display, filtering out already viewed stories (View-Once!)
  const feedStoriesGroups = React.useMemo(() => {
    const groups: { [userId: string]: Story[] } = {};
    stories.forEach((story) => {
      // Filter out if current user has viewed it
      if (currentUser && story.views.includes(currentUser.uid)) {
        return; // View-Once!
      }
      if (!groups[story.userId]) {
        groups[story.userId] = [];
      }
      groups[story.userId].push(story);
    });
    return Object.values(groups)
      .filter((group) => group.length > 0)
      .sort((a, b) => b[0].createdAt.getTime() - a[0].createdAt.getTime());
  }, [stories, currentUser]);

  return (
    <View className="flex-1 bg-themeBgLight">
      <StatusBar barStyle="dark-content" />

      {/* Sleek Row Header (Profile + Name + Compact Search) */}
      <View
        className="bg-white border-b border-purple-100/70 shadow-md shadow-purple-950/5 px-4 pb-3 flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 12 }}
      >
        {/* Left Part: Profile Photo & User Name */}
        <View className="flex-row items-center flex-1 mr-3">
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            className="active:opacity-85"
          >
            {/* Increased width & height from 42 to 52, and avatar size from 38 to 48 */}
            <View className="rounded-full bg-slate-50 border-2 border-purple-200 overflow-hidden shadow-sm" style={{ width: 52, height: 52 }}>
              <UserAvatar uri={currentUser?.avatar} size={48} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            className="ml-3 flex-1"
          >
            {/* Increased font size from text-base to text-lg */}
            <Text className="text-lg font-black text-[#3B1480] tracking-tight leading-5" style={{ fontWeight: '900' }} numberOfLines={1}>
              {currentUser?.name}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Part: Search Input */}
        {/* Slightly increased flex to 0.95, and maxWidth to 140 */}
        <View className="flex-row items-center bg-slate-50 border border-purple-100/60 rounded-full px-3 py-1.5 shadow-inner" style={{ flex: 0.95, maxWidth: 140 }}>
          <Ionicons name="search" size={15} color="#6A2FF9" />
          <TextInput
            className="flex-1 text-slate-800 font-semibold text-xs ml-1.5 py-0.5"
            placeholder="Search..."
            placeholderTextColor="#A78BFA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                fetchPosts(true).catch((error: any) => {
                  console.error('Failed to refresh posts after clear:', error);
                });
              }}
            >
              <Ionicons name="close-circle" size={14} color="#A78BFA" />
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
        {/* Horizontal Stories Bar */}
        <View className="mb-4 bg-white/40 rounded-[28px] overflow-hidden border border-purple-100/10 shadow-sm">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-4 px-3.5"
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {/* Add story button (Current User) */}
            <View className="items-center mr-4">
              <TouchableOpacity
                onPress={handleAddStory}
                className="relative active:opacity-90"
              >
                <View className="rounded-full bg-slate-50 border-2 border-dashed border-purple-300 p-0.5" style={{ width: 68, height: 68 }}>
                  <View className="rounded-full overflow-hidden w-full h-full bg-slate-100">
                    <UserAvatar uri={currentUser?.avatar} size={60} />
                  </View>
                </View>
                {/* Plus Badge */}
                <View className="absolute bottom-0 right-0 bg-[#6A2FF9] w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm">
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text className="text-[11px] font-bold text-slate-500 mt-1.5">
                My Pulse
              </Text>
            </View>

            {/* Grouped Stories */}
            {feedStoriesGroups.map((storyGroup) => {
              const lastStory = storyGroup[storyGroup.length - 1];
              const hasUnviewed = currentUser
                ? storyGroup.some((s) => !s.views.includes(currentUser.uid))
                : false;

              return (
                <View key={lastStory.userId} className="items-center mr-4">
                  <TouchableOpacity
                    onPress={async () => {
                      setViewerStoriesGroups(feedStoriesGroups);
                      const idx = feedStoriesGroups.findIndex((g) => g[0].userId === storyGroup[0].userId);
                      setActiveUserIndex(idx >= 0 ? idx : 0);
                      setActiveStoryIndex(0);
                    }}
                    className="active:opacity-85"
                  >
                    <View
                      className="rounded-full p-[2.5px]"
                      style={{
                        backgroundColor: hasUnviewed ? '#6A2FF9' : '#CBD5E1',
                        width: 68,
                        height: 68,
                      }}
                    >
                      <View className="rounded-full bg-white p-[2px] w-full h-full">
                        <View className="rounded-full overflow-hidden w-full h-full bg-slate-100">
                          <UserAvatar uri={lastStory.userAvatar} size={56} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text className="text-[11px] font-extrabold text-slate-700 mt-1.5 w-16 text-center" numberOfLines={1}>
                    {lastStory.userId === currentUser?.uid ? 'You' : lastStory.userName.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

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

      {/* Story Viewer Fullscreen Modal (Paging & Swipeable across different users) */}
      {activeUserIndex !== null && viewerStoriesGroups[activeUserIndex] && (
        <Modal
          visible={activeUserIndex !== null}
          animationType="fade"
          transparent
          onRequestClose={() => setActiveUserIndex(null)}
        >
          <View className="flex-1 bg-slate-950 justify-center relative">
            <StatusBar barStyle="light-content" backgroundColor="#020617" />

            <ScrollView
              ref={storyScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ width: viewerStoriesGroups.length * SCREEN_WIDTH }}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                if (newIndex !== activeUserIndex && newIndex >= 0 && newIndex < viewerStoriesGroups.length) {
                  setActiveUserIndex(newIndex);
                  setActiveStoryIndex(0);
                }
              }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            >
              {viewerStoriesGroups.map((storyGroup, userIdx) => {
                const isCurrentUser = userIdx === activeUserIndex;
                const storyIndex = isCurrentUser ? activeStoryIndex : 0;
                const activeStory = storyGroup[storyIndex];

                if (!activeStory) return null;

                return (
                  <View
                    key={storyGroup[0].userId}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'relative', justifyContent: 'center' }}
                  >
                    {/* Tap Gestures Overlay for Navigation */}
                    <View className="absolute inset-0 flex-row z-10">
                      {/* Left Side (Tap to go back) */}
                      <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1 h-full"
                        onPress={() => {
                          if (activeStoryIndex > 0) {
                            setActiveStoryIndex(activeStoryIndex - 1);
                          } else if (activeUserIndex > 0) {
                            const prevUserIdx = activeUserIndex - 1;
                            setActiveUserIndex(prevUserIdx);
                            setActiveStoryIndex(viewerStoriesGroups[prevUserIdx].length - 1);
                          } else {
                            setActiveUserIndex(null);
                          }
                        }}
                      />
                      {/* Right Side (Tap to go forward) */}
                      <TouchableOpacity
                        activeOpacity={1}
                        className="flex-1 h-full"
                        onPress={() => {
                          if (activeStoryIndex < storyGroup.length - 1) {
                            setActiveStoryIndex(activeStoryIndex + 1);
                          } else if (activeUserIndex < viewerStoriesGroups.length - 1) {
                            setActiveUserIndex(activeUserIndex + 1);
                            setActiveStoryIndex(0);
                          } else {
                            setActiveUserIndex(null);
                          }
                        }}
                      />
                    </View>

                    {/* Story Content Image */}
                    <Image
                      source={{ uri: activeStory.imageUrl }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />

                    {/* Top Header Controls (Above tap layer) */}
                    <View className="absolute top-12 left-0 right-0 px-4 z-20">
                      {/* Progress Indicators */}
                      <View className="flex-row space-x-1 mb-4">
                        {storyGroup.map((story, index) => (
                          <View
                            key={story.id}
                            className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
                          >
                            <View
                              className="h-full bg-white"
                              style={{
                                width: index < storyIndex ? '100%' : index === storyIndex ? '100%' : '0%',
                              }}
                            />
                          </View>
                        ))}
                      </View>

                      {/* Author & Info Bar */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="rounded-full bg-slate-800 border border-white/20 overflow-hidden" style={{ width: 40, height: 40 }}>
                            <UserAvatar uri={activeStory.userAvatar} size={38} />
                          </View>
                          <View className="ml-2.5">
                            <Text className="text-white font-extrabold text-sm shadow-sm" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 }}>
                              {activeStory.userName}
                            </Text>
                            <Text className="text-slate-300/80 font-bold text-[10px] shadow-sm mt-0.5" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 }}>
                              {formatDistanceToNow(new Date(activeStory.createdAt), { addSuffix: true })}
                            </Text>
                          </View>
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity
                          onPress={() => setActiveUserIndex(null)}
                          className="bg-black/40 rounded-full p-2 active:opacity-80"
                        >
                          <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: any) {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
}
