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

export default function ProfileScreen() {
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
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      setIsSaving(true);
      let avatarUrl = currentUser.avatar;

      if (editAvatar) {
        avatarUrl = await storageService.uploadImage(
          editAvatar,
          `avatars/${currentUser.uid}/${Date.now()}`
        );
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
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Profile Hero */}
      <View className="bg-white dark:bg-slate-900 px-4 pt-8 pb-6 items-center border-b border-slate-100 dark:border-slate-800">
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
          <UserAvatar uri={currentUser.avatar} size={100} />
          <View className="absolute bottom-0 right-0 bg-primary-600 w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-900">
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
          {currentUser.name}
        </Text>
        <Text className="text-slate-400 dark:text-slate-500 text-sm mt-1">
          {currentUser.email}
        </Text>

        {/* Badges */}
        <View className="flex-row mt-3 space-x-2">
          {currentUser.department && (
            <View className="bg-primary-50 dark:bg-primary-950 px-3.5 py-1.5 rounded-xl">
              <Text className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                {currentUser.department}
              </Text>
            </View>
          )}
          {currentUser.year && (
            <View className="bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl">
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                {currentUser.year} Year
              </Text>
            </View>
          )}
        </View>

        {currentUser.bio && (
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 px-6 text-sm leading-5">
            {currentUser.bio}
          </Text>
        )}
      </View>

      {/* Settings Cards */}
      <View className="px-4 mt-5">
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 ml-1">
          Account
        </Text>

        <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
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
            className="flex-row items-center p-4 border-b border-slate-50 dark:border-slate-800"
          >
            <View className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 items-center justify-center mr-3">
              <Ionicons name="create" size={18} color="#4F46E5" />
            </View>
            <Text className="flex-1 text-slate-800 dark:text-white font-medium text-[15px]">Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Dark Mode */}
          <TouchableOpacity
            onPress={toggleDarkMode}
            className="flex-row items-center p-4 border-b border-slate-50 dark:border-slate-800"
          >
            <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#818CF8' : '#F59E0B'} />
            </View>
            <Text className="flex-1 text-slate-800 dark:text-white font-medium text-[15px]">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <View
              className={`w-12 h-7 rounded-full p-0.5 ${isDark ? 'bg-primary-600' : 'bg-slate-300'}`}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white shadow-sm ${isDark ? 'ml-5' : 'ml-0'}`}
              />
            </View>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            onPress={handleChangePassword}
            className="flex-row items-center p-4"
          >
            <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
              <Ionicons name="key" size={18} color="#64748B" />
            </View>
            <Text className="flex-1 text-slate-800 dark:text-white font-medium text-[15px]">Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone */}
      <View className="px-4 mt-5 mb-8">
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex-row items-center border border-red-100 dark:border-red-900/50"
        >
          <View className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 items-center justify-center mr-3">
            <Ionicons name="log-out" size={18} color="#EF4444" />
          </View>
          <Text className="flex-1 text-red-500 font-semibold text-[15px]">Sign Out</Text>
          <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text className="text-center text-xs text-slate-300 dark:text-slate-700 mb-6">
        Campus Connect v1.0.0
      </Text>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-slate-900"
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-slate-500 font-medium text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isSaving}
              className="bg-primary-600 px-5 py-2 rounded-xl"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-sm">Save</Text>
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
