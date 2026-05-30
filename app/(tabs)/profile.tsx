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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateProfile } = useAuth();

  const { isDark, toggleDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editDepartment, setEditDepartment] = useState(currentUser?.department || '');
  const [editYear, setEditYear] = useState(currentUser?.year || '');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    <ScrollView 
      className="flex-1 bg-themeBgLight" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Profile Hero Panel (Beautiful Translucent Card) */}

      <View className="bg-white/75 border border-white/30 rounded-3xl m-4 px-5 pt-8 pb-7 items-center shadow-xl shadow-purple-950/5">
        <TouchableOpacity
          onPress={() => {
            setEditAvatar(null);
            setEditName(currentUser.name);
            setEditBio(currentUser.bio);
            setEditDepartment(currentUser.department);
            setEditYear(currentUser.year);
            setShowEditModal(true);
          }}
          className="relative"
        >
          {/* Avatar Ring */}
          <View className="p-1 rounded-full border-2 border-[#6A2FF9]/30">
            <UserAvatar uri={currentUser.avatar} size={104} />
          </View>
          <View className="absolute bottom-1 right-1 bg-[#6A2FF9] w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-md">
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
          {currentUser.name}
        </Text>
        <Text className="text-[#6A2FF9] font-bold text-sm mt-1">
          {currentUser.email}
        </Text>

        {/* Badges / Chips */}
        <View className="flex-row mt-4 space-x-2">
          {currentUser.department && (
            <View className="bg-[#6A2FF9] px-4 py-2 rounded-2xl shadow-sm">
              <Text className="text-white text-xs font-bold">
                {currentUser.department}
              </Text>
            </View>
          )}
          {currentUser.year && (
            <View className="bg-white border border-[#6A2FF9]/20 px-4 py-2 rounded-2xl shadow-sm">
              <Text className="text-[#6A2FF9] text-xs font-bold">
                {currentUser.year} Year
              </Text>
            </View>
          )}
        </View>

        {currentUser.bio ? (
          <Text className="text-slate-600 text-center mt-5 px-4 text-[14px] leading-5 font-medium">
            {currentUser.bio}
          </Text>
        ) : (
          <Text className="text-slate-400 text-center mt-5 px-4 text-xs italic">
            No bio added yet. Tap camera/avatar to edit profile.
          </Text>
        )}
      </View>

      {/* Settings Panel (Glassmorphic Box) */}
      <View className="px-4 mt-2">
        <Text className="text-xs font-extrabold uppercase tracking-widest text-[#6A2FF9] mb-3.5 ml-2.5">
          Account Settings
        </Text>

        <View className="bg-white/80 border border-white/30 rounded-3xl overflow-hidden shadow-lg shadow-purple-950/5">
          {/* Edit Profile */}
          <TouchableOpacity
            onPress={() => {
              setEditName(currentUser.name);
              setEditBio(currentUser.bio);
              setEditDepartment(currentUser.department);
              setEditYear(currentUser.year);
              setEditAvatar(null);
              setShowEditModal(true);
            }}
            className="flex-row items-center p-4.5 border-b border-[#6A2FF9]/5"
          >
            <View className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center mr-3.5 border border-purple-100">
              <Ionicons name="create-outline" size={19} color="#6A2FF9" />
            </View>
            <Text className="flex-1 text-slate-800 font-extrabold text-[15px]">Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#A78BFA" />
          </TouchableOpacity>

          {/* Dark Mode */}
          <TouchableOpacity
            onPress={toggleDarkMode}
            className="flex-row items-center p-4.5 border-b border-[#6A2FF9]/5"
          >
            <View className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center mr-3.5 border border-purple-100">
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={19} color="#6A2FF9" />
            </View>
            <Text className="flex-1 text-slate-800 font-extrabold text-[15px]">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <View
              className={`w-12 h-7 rounded-full p-0.5 ${isDark ? 'bg-[#6A2FF9]' : 'bg-slate-200'}`}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white shadow-sm ${isDark ? 'ml-5' : 'ml-0'}`}
              />
            </View>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            onPress={handleChangePassword}
            className="flex-row items-center p-4.5"
          >
            <View className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center mr-3.5 border border-purple-100">
              <Ionicons name="key-outline" size={19} color="#6A2FF9" />
            </View>
            <Text className="flex-1 text-slate-800 font-extrabold text-[15px]">Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color="#A78BFA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone (Sign Out button) */}
      <View className="px-4 mt-5 mb-8">
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white/80 border border-red-100 rounded-3xl p-4.5 flex-row items-center shadow-lg shadow-purple-950/5"
        >
          <View className="w-10 h-10 rounded-2xl bg-red-50 items-center justify-center mr-3.5 border border-red-100">
            <Ionicons name="log-out-outline" size={19} color="#EF4444" />
          </View>
          <Text className="flex-1 text-red-500 font-bold text-[15px]">Sign Out</Text>
          <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text className="text-center text-xs font-bold text-slate-400 mb-8">
        Campus Connect v1.0.0
      </Text>


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
    </ScrollView>
  );
}
