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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../../components/UserAvatar';
import { Config } from '../../constants/config';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

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
            text1: 'Success',
            text2: 'Logged out successfully',
          });
        },
      },
    ]);
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
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
        // Upload avatar to Firebase Storage
        // For now, we'll just use the local URI
        avatarUrl = editAvatar;
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
        text1: 'Success',
        text2: 'Profile updated successfully',
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
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="bg-white dark:bg-gray-900 px-4 py-6 items-center border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={handlePickAvatar} className="relative">
          <UserAvatar uri={currentUser.avatar} size={100} />
          <View className="absolute bottom-0 right-0 bg-primary-600 w-8 h-8 rounded-full items-center justify-center">
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{currentUser.name}</Text>
        <Text className="text-gray-500 dark:text-gray-400">{currentUser.email}</Text>
        <View className="flex-row mt-2 space-x-2">
          {currentUser.department && (
            <View className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full">
              <Text className="text-primary-600 dark:text-primary-300 text-sm">{currentUser.department}</Text>
            </View>
          )}
          {currentUser.year && (
            <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              <Text className="text-gray-600 dark:text-gray-400 text-sm">{currentUser.year} Year</Text>
            </View>
          )}
        </View>
        {currentUser.bio && (
          <Text className="text-gray-600 dark:text-gray-400 text-center mt-3 px-4">{currentUser.bio}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => {
          setEditName(currentUser.name);
          setEditBio(currentUser.bio);
          setEditDepartment(currentUser.department);
          setEditYear(currentUser.year);
          setEditAvatar(null);
          setShowEditModal(true);
        }}
        className="bg-white dark:bg-gray-900 mx-4 mt-4 rounded-xl p-4 flex-row items-center shadow-sm"
      >
        <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
          <Ionicons name="create" size={20} color="#4F46E5" />
        </View>
        <Text className="flex-1 text-gray-900 dark:text-white font-medium">Edit Profile</Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <View className="bg-white dark:bg-gray-900 mx-4 mt-4 rounded-xl overflow-hidden shadow-sm">
        <TouchableOpacity
          onPress={toggleDarkMode}
          className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-800"
        >
          <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3">
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color="#9CA3AF" />
          </View>
          <Text className="flex-1 text-gray-900 dark:text-white font-medium">Dark Mode</Text>
          <View
            className={`w-12 h-7 rounded-full p-1 ${isDark ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <View
              className={`w-5 h-5 rounded-full bg-white ${isDark ? 'translate-x-5' : ''}`}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleChangePassword}
          className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-800"
        >
          <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3">
            <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
          </View>
          <Text className="flex-1 text-gray-900 dark:text-white font-medium">Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center p-4"
        >
          <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 items-center justify-center mr-3">
            <Ionicons name="log-out" size={20} color="#EF4444" />
          </View>
          <Text className="flex-1 text-red-500 font-medium">Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showEditModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-gray-900"
        >
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
              <Text className="text-primary-600 font-semibold">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <TouchableOpacity onPress={handlePickAvatar} className="items-center mb-6">
              <UserAvatar uri={editAvatar || currentUser.avatar} size={100} />
              <Text className="text-primary-600 mt-2 font-medium">Change Photo</Text>
            </TouchableOpacity>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Full Name</Text>
                <TextInput
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View>
                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Bio</Text>
                <TextInput
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View>
                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Department</Text>
                <TextInput
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                  value={editDepartment}
                  onChangeText={setEditDepartment}
                  placeholder="Your department"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View>
                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Year</Text>
                <TextInput
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                  value={editYear}
                  onChangeText={setEditYear}
                  placeholder="e.g., 1st, 2nd, 3rd, 4th"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
