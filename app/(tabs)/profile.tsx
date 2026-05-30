import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../../components/UserAvatar';
import { Config } from '../../constants/config';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { storageService } from '../../services/storageService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { router } from 'expo-router';
import { usePosts } from '../../hooks/usePosts';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateProfile } = useAuth();
  const { posts } = usePosts();
  const userPosts = currentUser ? posts.filter((p) => p.authorId === currentUser.uid) : [];

  const { isDark, toggleDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editDepartment, setEditDepartment] = useState(currentUser?.department || '');
  const [editYear, setEditYear] = useState(currentUser?.year || '');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickCover = async () => {
    if (!currentUser) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        let coverBase64 = '';
        if (result.assets[0].base64) {
          coverBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        } else {
          coverBase64 = result.assets[0].uri;
        }

        Toast.show({ type: 'info', text1: 'Uploading...', text2: 'Saving cover photo' });
        await updateProfile({ coverImage: coverBase64 });
        Toast.show({ type: 'success', text1: 'Success', text2: 'Cover photo updated! 🎉' });
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: e.message || 'Could not save cover image' });
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Toast.show({
            type: 'success',
            text1: 'Signed Out',
            text2: 'Come back soon!',
          });
        },
      },
    ]);
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Compressed for fast Firestore profile avatar storage
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (result.assets[0].base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setEditAvatar(base64Uri);
      } else {
        // Fallback for Web
        try {
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setEditAvatar(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error(e);
          setEditAvatar(result.assets[0].uri);
        }
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      setIsSaving(true);
      let avatarUrl = currentUser.avatar;

      if (editAvatar) {
        if (editAvatar.startsWith('data:')) {
          avatarUrl = editAvatar;
        } else {
          try {
            avatarUrl = await storageService.uploadImage(
              editAvatar,
              `avatars/${currentUser.uid}/${Date.now()}`
            );
          } catch (e) {
            avatarUrl = editAvatar;
          }
        }
      }

      await updateProfile({
        name: editName,
        bio: editBio,
        department: editDepartment,
        year: editYear,
        avatar: avatarUrl,
      });

      setShowEditModal(false);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your changes are live now',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) return;
    try {
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password reset email sent',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send reset email',
      });
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-themeBgLight p-4 pt-12">
        <SkeletonLoader type="profile" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-themeBgLight">
      <StatusBar barStyle="dark-content" />

      {/* Profile Navigation Header */}
      <View 
        className="bg-white px-5 pb-4 border-b border-purple-100/70 shadow-md shadow-purple-950/5 flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center border border-purple-100"
        >
          <Ionicons name="arrow-back" size={20} color="#6A2FF9" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-900 tracking-tight">
          Profile Hub
        </Text>
        <TouchableOpacity 
          onPress={toggleDarkMode}
          className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center border border-purple-100"
        >
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color="#6A2FF9" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-themeBgLight" showsVerticalScrollIndicator={false}>
        {/* LinkedIn-Style Cover Banner Container */}
        <View className="relative w-full h-44 bg-slate-200">
          <Image 
            source={{ uri: currentUser.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800' }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          <TouchableOpacity 
            onPress={handlePickCover}
            className="absolute top-3 right-3 bg-black/40 w-9 h-9 rounded-full items-center justify-center border border-white/20 active:opacity-80"
          >
            <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Overlapping Centered Profile Avatar */}
          <View 
            className="absolute -bottom-14 w-28 h-28 rounded-full border-4 border-white bg-slate-50 shadow-lg items-center justify-center overflow-hidden"
            style={{ left: '50%', marginLeft: -56 }}
          >
            <Image 
              source={{ uri: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
            <TouchableOpacity 
              onPress={() => {
                setEditName(currentUser.name);
                setEditBio(currentUser.bio);
                setEditDepartment(currentUser.department);
                setEditYear(currentUser.year);
                setEditAvatar(null);
                setShowEditModal(true);
              }}
              className="absolute bottom-1 right-1 bg-[#6A2FF9] w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md active:opacity-90"
            >
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Details & Biography Card */}
        <View className="pt-16 items-center px-6">
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
            {currentUser.name}
          </Text>
          <Text className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider mt-0.5 text-center">
            {currentUser.email}
          </Text>
          
          {currentUser.bio ? (
            <Text className="text-slate-600 text-center mt-3.5 px-4 text-sm leading-5 font-medium">
              {currentUser.bio}
            </Text>
          ) : (
            <Text className="text-slate-400 text-center mt-3.5 px-4 text-xs italic">
              No biography details added. Tap the edit button to complete your profile!
            </Text>
          )}

          {/* Action Buttons */}
          <View className="flex-row items-center justify-center mt-5 space-x-3 w-full max-w-[280px]">
            <TouchableOpacity
              onPress={() => {
                setEditName(currentUser.name);
                setEditBio(currentUser.bio);
                setEditDepartment(currentUser.department);
                setEditYear(currentUser.year);
                setEditAvatar(null);
                setShowEditModal(true);
              }}
              className="flex-1 bg-[#6A2FF9] py-3 rounded-2xl items-center shadow-md shadow-purple-900/10 active:opacity-90"
            >
              <Text className="text-white font-extrabold text-sm">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats & Metadata Counts */}
        <View className="flex-row border-y border-slate-100 my-6 py-4.5 bg-slate-50/50 justify-around">
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-slate-800">{userPosts.length}</Text>
            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mt-0.5">Posts</Text>
          </View>
          <View className="items-center flex-1 border-x border-slate-100">
            <Text className="text-sm font-extrabold text-[#6A2FF9] px-2 text-center" numberOfLines={1}>
              {currentUser.department || 'Student'}
            </Text>
            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mt-1">Dept</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-slate-800">{currentUser.year || 'General'}</Text>
            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mt-0.5">Year</Text>
          </View>
        </View>

        {/* Instagram-Style Posts Grid */}
        <View className="px-4 pb-12">
          <View className="flex-row items-center mb-4.5 px-1 justify-between">
            <Text className="text-slate-900 font-extrabold text-lg tracking-tight">
              Your Campus Posts
            </Text>
            <Ionicons name="grid-outline" size={18} color="#6A2FF9" />
          </View>

          {userPosts.length === 0 ? (
            <View className="items-center justify-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <Ionicons name="images-outline" size={32} color="#94A3B8" />
              <Text className="text-slate-500 font-extrabold text-sm mt-2">No Posts Yet</Text>
              <Text className="text-slate-400 font-semibold text-xs mt-0.5">Share campus moments to see them here!</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => {
                    Alert.alert(
                      "Post Detail",
                      post.content,
                      [{ text: "Close", style: "cancel" }]
                    );
                  }}
                  className="w-[31.3%] aspect-square m-[1%] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm active:opacity-90"
                >
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="bg-[#6A2FF9]/5 border border-[#6A2FF9]/10 w-full h-full p-2.5 items-center justify-center">
                      <Text className="text-[10px] font-extrabold text-[#6A2FF9] text-center" numberOfLines={4}>
                        {post.content}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* App Version */}
        <Text className="text-center text-xs font-bold text-slate-400 mb-8">
          Campus Connect v1.0.0
        </Text>
      </ScrollView>


      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-slate-900"
        >
          {/* Modal Header */}
          <View 
            className="flex-row items-center justify-between px-5 pb-4 border-b border-slate-100"
            style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
          >
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-slate-500 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-slate-900">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isSaving}
              className="bg-[#6A2FF9] px-5 py-2.5 rounded-full"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-extrabold text-sm">Save</Text>
              )}
            </TouchableOpacity>
          </View>


          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            {/* Avatar Picker */}
            <TouchableOpacity onPress={handlePickAvatar} className="items-center mb-8">
              <UserAvatar uri={editAvatar || currentUser.avatar} size={100} />
              <Text className="text-primary-600 dark:text-primary-400 mt-2 font-medium text-sm">
                Change Photo
              </Text>
            </TouchableOpacity>

            {/* Form Fields */}
            <View className="space-y-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Full Name
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Bio
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Department
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                  value={editDepartment}
                  onChangeText={setEditDepartment}
                  placeholder="e.g., Computer Science"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Year
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                  value={editYear}
                  onChangeText={setEditYear}
                  placeholder="e.g., 1st, 2nd, 3rd, 4th"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
