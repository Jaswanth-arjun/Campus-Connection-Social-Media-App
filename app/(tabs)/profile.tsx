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
import {
  DiceBearConfig,
  getDiceBearUrl,
  compileDiceBearAvatar,
  getDefaultConfigForStyle,
  ADVENTURER_OPTIONS,
  AVATAAARS_OPTIONS,
  LORELEI_OPTIONS,
  OPEN_PEEPS_OPTIONS,
  MICAH_OPTIONS,
} from '../../utils/avatarGenerator';

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
  const [editCover, setEditCover] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Avatar Builder States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeAvatarTab, setActiveAvatarTab] = useState<'artStyle' | 'gender' | 'features' | 'accessories'>('artStyle');
  const [isCompilingAvatar, setIsCompilingAvatar] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<DiceBearConfig>({
    style: 'adventurer',
    gender: 'male',
    hair: 'short01',
    hairColor: '09090b',
    skinColor: 'f5c0b1',
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'smile',
    glasses: 'none',
    bgColor: 'c0aede',
    shirtColor: '4f46e5',
  });

  const handlePickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (result.assets[0].base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setEditCover(base64Uri);
      } else {
        // Fallback for Web
        try {
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setEditCover(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error(e);
          setEditCover(result.assets[0].uri);
        }
      }
    }
  };

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

  const handlePickAvatarOption = () => {
    Alert.alert(
      'Profile Picture',
      'Choose how you want to set your profile picture:',
      [
        {
          text: '🎨 Create 2D Vector Avatar',
          onPress: () => {
            setAvatarConfig(getDefaultConfigForStyle('adventurer', 'male'));
            setShowAvatarModal(true);
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: handlePickAvatar,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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
      let coverUrl = currentUser.coverImage || '';

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

      if (editCover) {
        if (editCover.startsWith('data:')) {
          coverUrl = editCover;
        } else {
          try {
            coverUrl = await storageService.uploadImage(
              editCover,
              `covers/${currentUser.uid}/${Date.now()}`
            );
          } catch (e) {
            coverUrl = editCover;
          }
        }
      }

      await updateProfile({
        name: editName,
        bio: editBio,
        department: editDepartment,
        year: editYear,
        avatar: avatarUrl,
        coverImage: coverUrl,
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
                setEditCover(null);
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
                setEditCover(null);
                setShowEditModal(true);
              }}
              className="flex-1 bg-[#6A2FF9] py-3 rounded-2xl items-center shadow-md shadow-purple-900/10 active:opacity-90"
            >
              <Text className="text-white font-extrabold text-sm">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-1 bg-red-500 py-3 rounded-2xl items-center shadow-md shadow-red-900/10 active:opacity-90"
            >
              <Text className="text-white font-extrabold text-sm">Logout</Text>
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
            {/* Beautiful Side-by-Side Photo & Cover Pickers */}
            <View className="flex-row justify-around items-center mb-8 bg-[#6A2FF9]/5 p-5 rounded-3xl border border-[#6A2FF9]/10">
              {/* Avatar Picker */}
              <TouchableOpacity onPress={handlePickAvatarOption} className="items-center flex-1">
                <UserAvatar uri={editAvatar || currentUser.avatar} size={76} />
                <Text className="text-[#6A2FF9] mt-2 font-extrabold text-xs uppercase tracking-wider">
                  Change Photo
                </Text>
              </TouchableOpacity>

              {/* Divider line */}
              <View className="w-[1px] h-14 bg-[#6A2FF9]/15" />

              {/* Cover Picker */}
              <TouchableOpacity onPress={handlePickCoverImage} className="items-center flex-1">
                <Image
                  source={{ uri: editCover || currentUser.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800' }}
                  className="w-24 h-15 rounded-xl border border-slate-200"
                  resizeMode="cover"
                />
                <Text className="text-[#6A2FF9] mt-2.5 font-extrabold text-xs uppercase tracking-wider">
                  Change Cover
                </Text>
              </TouchableOpacity>
            </View>

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

      {/* 2D Vector Avatar Builder Modal */}
      <Modal visible={showAvatarModal} animationType="slide">
        <View 
          className="flex-1 bg-slate-950"
          style={{ paddingTop: insets.top > 0 ? insets.top : 20 }}
        >
          {/* Header Controls */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900">
            <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
              <Text className="text-white/60 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-white">Cartoon Avatar Studio</Text>
            <TouchableOpacity
              onPress={async () => {
                try {
                  setIsCompilingAvatar(true);
                  const compiledBase64 = await compileDiceBearAvatar(avatarConfig);
                  setEditAvatar(compiledBase64);
                  setShowAvatarModal(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Avatar Assembled! 🎨🌟',
                    text2: 'Tap Save Profile to finalize your live DP',
                  });
                } catch (e) {
                  console.error(e);
                  // Fallback to direct URL if compilation fails
                  const directUrl = getDiceBearUrl(avatarConfig);
                  setEditAvatar(directUrl);
                  setShowAvatarModal(false);
                } finally {
                  setIsCompilingAvatar(false);
                }
              }}
              disabled={isCompilingAvatar}
              className="bg-[#6A2FF9] px-5 py-2.5 rounded-full"
            >
              {isCompilingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-extrabold text-sm">Save Avatar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Premium Canvas Live Viewfinder */}
          <View className="items-center justify-center py-10 bg-slate-900 border-b border-white/5 relative">
            <View className="w-36 h-36 rounded-full border-4 border-[#6A2FF9]/50 overflow-hidden bg-slate-800 shadow-2xl shadow-black/80 items-center justify-center">
              {isCompilingAvatar ? (
                <ActivityIndicator size="large" color="#6A2FF9" />
              ) : (
                <Image
                  source={{ uri: getDiceBearUrl(avatarConfig) }}
                  className="w-full h-full"
                  style={{ width: 140, height: 140 }}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-4">
              {avatarConfig.style === 'adventurer'
                ? 'Snapchat Adventurer Style ⚡'
                : avatarConfig.style === 'avataaars'
                ? 'Instagram Minimal Flat Style 🎨'
                : avatarConfig.style === 'open-peeps'
                ? 'Open Peeps Hand-Drawn Style 🧑‍🎨'
                : avatarConfig.style === 'micah'
                ? 'Micah Abstract Geometric Style 💎'
                : 'Lorelei Aesthetic Anime Style 💖'}
            </Text>
          </View>

          {/* Premium Category Navigation Tabs */}
          <View className="border-b border-white/5 bg-slate-950">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-4">
              <View className="flex-row space-x-3">
                {[
                  { id: 'artStyle', name: '1. Art Style', icon: 'color-palette-outline' },
                  { id: 'gender', name: '2. Gender & BG', icon: 'people-outline' },
                  { id: 'features', name: '3. Face & Hair', icon: 'happy-outline' },
                  { id: 'accessories', name: '4. Accessories', icon: 'glasses-outline' },
                ].map((tab) => {
                  const isSelected = activeAvatarTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setActiveAvatarTab(tab.id as any)}
                      className="flex-row items-center px-4 py-2 rounded-2xl border"
                      style={{
                        backgroundColor: isSelected ? '#6A2FF9' : 'transparent',
                        borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Ionicons name={tab.icon as any} size={15} color={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} />
                      <Text
                        className="text-xs font-black ml-1.5"
                        style={{ color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}
                      >
                        {tab.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Studio Workspace panels */}
          <ScrollView className="flex-1 p-5 bg-slate-900" showsVerticalScrollIndicator={false}>
            
            {/* Panel 1: Art Style Selection */}
            {activeAvatarTab === 'artStyle' && (
              <View className="space-y-6">
                <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-1">
                  Choose Design Theme
                </Text>
                
                {[
                  {
                    id: 'adventurer',
                    title: '🌟 Adventurer Cartoon',
                    desc: 'Snapchat Bitmoji-inspired Disney 3D style character illustration. Premium depth and stunning detailing.',
                  },
                  {
                    id: 'avataaars',
                    title: '🎨 Modern Minimalist Flat',
                    desc: 'Instagram-inspired aesthetic flat graphics with custom round frames and trendy geometric designs.',
                  },
                  {
                    id: 'open-peeps',
                    title: '🧑‍🎨 Open Peeps Hand-Drawn',
                    desc: 'Aesthetic, hand-drawn comic character illustrations (Notion sketch style). Highly artistic and custom.',
                  },
                  {
                    id: 'micah',
                    title: '💎 Micah Abstract Art',
                    desc: 'Modern, flat geometric fashion faces. Distinctly stylish and premium artistic vector profiles.',
                  },
                  {
                    id: 'lorelei',
                    title: '💖 Kawaii Anime / Aesthetic',
                    desc: 'Super cute anime chibi artwork with gorgeous pastel hair dyes and elegant aesthetic details.',
                  },
                ].map((style) => {
                  const isSelected = avatarConfig.style === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      onPress={() => {
                        setAvatarConfig(getDefaultConfigForStyle(style.id as any, avatarConfig.gender));
                      }}
                      className="p-5 rounded-3xl border-2 mb-3 relative"
                      style={{
                        borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.12)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <Text className="text-white font-extrabold text-base mb-1.5">{style.title}</Text>
                      <Text className="text-white/60 text-xs leading-relaxed">{style.desc}</Text>
                      {isSelected && (
                        <View className="absolute top-4 right-4 bg-[#6A2FF9] w-6 h-6 rounded-full items-center justify-center shadow-md">
                          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Panel 2: Gender & Background Setup */}
            {activeAvatarTab === 'gender' && (
              <View className="space-y-6">
                
                {/* Gender Toggle */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Select Gender Base
                  </Text>
                  <View className="flex-row space-x-4">
                    {[
                      { id: 'male', name: 'Male Base', icon: 'male' },
                      { id: 'female', name: 'Female Base', icon: 'female' },
                    ].map((g) => {
                      const isSelected = avatarConfig.gender === g.id;
                      return (
                        <TouchableOpacity
                          key={g.id}
                          onPress={() => {
                            setAvatarConfig(getDefaultConfigForStyle(avatarConfig.style, g.id as any));
                          }}
                          className="flex-1 p-5 rounded-3xl border-2 items-center relative"
                          style={{
                            borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.05)',
                            backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.1)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <Ionicons name={g.icon as any} size={32} color={isSelected ? '#A78BFA' : 'rgba(255,255,255,0.4)'} />
                          <Text className="text-white font-extrabold text-sm mt-3.5">{g.name}</Text>
                          {isSelected && (
                            <View className="absolute top-2 right-2 bg-[#6A2FF9] w-5 h-5 rounded-full items-center justify-center">
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Customizer Solid / Gradient Background */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Solid Portrait Background
                  </Text>
                  <View className="flex-row flex-wrap">
                    {ADVENTURER_OPTIONS.bgColors.map((color) => {
                      const isSelected = avatarConfig.bgColor === color.id;
                      return (
                        <TouchableOpacity
                          key={color.id}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, bgColor: color.id }))}
                          className="items-center m-2"
                        >
                          <View
                            className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-lg"
                            style={{
                              borderColor: isSelected ? '#FFFFFF' : 'transparent',
                              backgroundColor: `#${color.id}`,
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={18} color={color.id === '0f172a' ? '#FFFFFF' : '#000000'} />}
                          </View>
                          <Text className="text-white/40 text-[9px] font-bold mt-1.5">{color.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Panel 3: Face & Hair Styling */}
            {activeAvatarTab === 'features' && (
              <View className="space-y-6">
                
                {/* Skin Complexion Pickers */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Skin Complexion
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(avatarConfig.style === 'adventurer'
                      ? ADVENTURER_OPTIONS.skinColors
                      : avatarConfig.style === 'avataaars'
                      ? AVATAAARS_OPTIONS.skinColors
                      : avatarConfig.style === 'open-peeps'
                      ? OPEN_PEEPS_OPTIONS.skinColors
                      : avatarConfig.style === 'micah'
                      ? MICAH_OPTIONS.skinColors
                      : LORELEI_OPTIONS.skinColors
                    ).map((skin) => {
                      const isSelected = avatarConfig.skinColor === skin.value;
                      const displayBg = `#${skin.value}`;
                      return (
                        <TouchableOpacity
                          key={skin.value}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, skinColor: skin.value }))}
                          className="items-center m-2"
                        >
                          <View
                            className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-md"
                            style={{
                              borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.1)',
                              backgroundColor: displayBg,
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                          </View>
                          <Text className="text-white/40 text-[9px] font-bold mt-1.5">{skin.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Dynamic Hairstyles List */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Hairstyle Style ({avatarConfig.gender === 'male' ? 'Male' : 'Female'})
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(avatarConfig.style === 'adventurer'
                      ? (avatarConfig.gender === 'male' ? ADVENTURER_OPTIONS.maleHair : ADVENTURER_OPTIONS.femaleHair)
                      : avatarConfig.style === 'avataaars'
                      ? (avatarConfig.gender === 'male' ? AVATAAARS_OPTIONS.maleHair : AVATAAARS_OPTIONS.femaleHair)
                      : avatarConfig.style === 'open-peeps'
                      ? (avatarConfig.gender === 'male' ? OPEN_PEEPS_OPTIONS.maleHair : OPEN_PEEPS_OPTIONS.femaleHair)
                      : avatarConfig.style === 'micah'
                      ? MICAH_OPTIONS.hair
                      : LORELEI_OPTIONS.hair
                    ).map((hair) => {
                      const isSelected = avatarConfig.hair === hair.id;
                      return (
                        <TouchableOpacity
                          key={hair.id}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, hair: hair.id }))}
                          className="px-4 py-2.5 rounded-2xl m-1.5 border"
                          style={{
                            borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                            backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <Text
                            className="text-xs font-extrabold"
                            style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                          >
                            {hair.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Hair Coloring Dyebox */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Hair Dye Color
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(avatarConfig.style === 'adventurer'
                      ? ADVENTURER_OPTIONS.hairColors
                      : avatarConfig.style === 'avataaars'
                      ? AVATAAARS_OPTIONS.hairColors
                      : avatarConfig.style === 'open-peeps'
                      ? OPEN_PEEPS_OPTIONS.hairColors
                      : avatarConfig.style === 'micah'
                      ? MICAH_OPTIONS.hairColors
                      : LORELEI_OPTIONS.hairColors
                    ).map((color) => {
                      const isSelected = avatarConfig.hairColor === color.value;
                      const displayBg = `#${color.value}`;
                      return (
                        <TouchableOpacity
                          key={color.value}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, hairColor: color.value }))}
                          className="items-center m-2"
                        >
                          <View
                            className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-lg"
                            style={{
                              borderColor: isSelected ? '#FFFFFF' : 'transparent',
                              backgroundColor: displayBg,
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                          </View>
                          <Text className="text-white/40 text-[9px] font-bold mt-1.5">{color.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Facial Eyes & Mouth Expressions */}
                {avatarConfig.style !== 'lorelei' && (
                  <>
                    <View>
                      <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                        {avatarConfig.style === 'open-peeps' ? 'Facial Expression' : 'Eyes Shape & Expression'}
                      </Text>
                      <View className="flex-row flex-wrap">
                        {(avatarConfig.style === 'adventurer'
                          ? ADVENTURER_OPTIONS.eyes
                          : avatarConfig.style === 'avataaars'
                          ? AVATAAARS_OPTIONS.eyes
                          : avatarConfig.style === 'open-peeps'
                          ? OPEN_PEEPS_OPTIONS.eyes
                          : MICAH_OPTIONS.eyes
                        ).map((eye) => {
                          const isSelected = avatarConfig.eyes === eye.id;
                          return (
                            <TouchableOpacity
                              key={eye.id}
                              onPress={() => setAvatarConfig((prev) => ({ ...prev, eyes: eye.id }))}
                              className="px-4 py-2.5 rounded-2xl m-1.5 border"
                              style={{
                                borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                                backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                              }}
                            >
                              <Text
                                className="text-xs font-extrabold"
                                style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                              >
                                {eye.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {avatarConfig.style !== 'open-peeps' && (
                      <View>
                        <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                          Happy Mouth Shape
                        </Text>
                        <View className="flex-row flex-wrap">
                          {(avatarConfig.style === 'adventurer'
                            ? ADVENTURER_OPTIONS.mouths
                            : avatarConfig.style === 'avataaars'
                            ? AVATAAARS_OPTIONS.mouths
                            : MICAH_OPTIONS.mouths
                          ).map((m) => {
                            const isSelected = avatarConfig.mouth === m.id;
                            return (
                              <TouchableOpacity
                                key={m.id}
                                onPress={() => setAvatarConfig((prev) => ({ ...prev, mouth: m.id }))}
                                className="px-4 py-2.5 rounded-2xl m-1.5 border"
                                style={{
                                  borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                                  backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                                }}
                              >
                                <Text
                                  className="text-xs font-extrabold"
                                  style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                                >
                                  {m.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Panel 4: Eyewear & Outerwear Clothes */}
            {activeAvatarTab === 'accessories' && (
              <View className="space-y-6">
                
                {/* Glasses / Sunglasses customizers */}
                {avatarConfig.style !== 'lorelei' && (
                  <View>
                    <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                      Eyewear & Glasses Frames
                    </Text>
                    <View className="flex-row flex-wrap">
                      {(avatarConfig.style === 'adventurer'
                        ? ADVENTURER_OPTIONS.glasses
                        : avatarConfig.style === 'avataaars'
                        ? AVATAAARS_OPTIONS.glasses
                        : avatarConfig.style === 'open-peeps'
                        ? OPEN_PEEPS_OPTIONS.glasses
                        : MICAH_OPTIONS.glasses
                      ).map((glass) => {
                        const isSelected = avatarConfig.glasses === glass.id;
                        return (
                          <TouchableOpacity
                            key={glass.id}
                            onPress={() => setAvatarConfig((prev) => ({ ...prev, glasses: glass.id }))}
                            className="px-4 py-2.5 rounded-2xl m-1.5 border"
                            style={{
                              borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                            }}
                          >
                            <Text
                              className="text-xs font-extrabold"
                              style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                            >
                              {glass.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Clothing Dress Tshirts (Adventurer/Open Peeps/Micah styles) */}
                {(avatarConfig.style === 'adventurer' || avatarConfig.style === 'open-peeps' || avatarConfig.style === 'micah') && (
                  <View>
                    <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                      T-Shirt Outerwear Color
                    </Text>
                    <View className="flex-row flex-wrap">
                      {ADVENTURER_OPTIONS.shirtColors.map((color) => {
                        const isSelected = avatarConfig.shirtColor === color.value;
                        return (
                          <TouchableOpacity
                            key={color.value}
                            onPress={() => setAvatarConfig((prev) => ({ ...prev, shirtColor: color.value }))}
                            className="items-center m-2"
                          >
                            <View
                              className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-lg"
                              style={{
                                borderColor: isSelected ? '#FFFFFF' : 'transparent',
                                backgroundColor: `#${color.value}`,
                              }}
                            >
                              {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                            </View>
                            <Text className="text-white/40 text-[9px] font-bold mt-1.5">{color.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View className="pt-6">
                  <Text className="text-white/40 text-center text-xs leading-relaxed">
                    Choose from hundreds of character styles & variations. Save your character design above to immediately update all your live campus pulses!
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
