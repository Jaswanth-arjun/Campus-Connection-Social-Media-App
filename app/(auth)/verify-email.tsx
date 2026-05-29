import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../services/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function VerifyEmailScreen() {
  const { logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const checkVerificationStatus = async () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      setIsChecking(true);
      await user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser?.emailVerified) {
        Toast.show({
          type: 'success',
          text1: 'Email Verified!',
          text2: 'Welcome to Campus Connect!',
        });
        router.replace('/(tabs)/feed');
      } else {
        Toast.show({
          type: 'info',
          text1: 'Not Verified Yet',
          text2: 'Please click the link in your email and try again.',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to check verification status',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;
    if (cooldown > 0) return;

    try {
      setIsResending(true);
      await sendEmailVerification(user);
      setCooldown(60);
      Toast.show({
        type: 'success',
        text1: 'Verification Sent',
        text2: `A new link has been sent to ${user.email}`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to resend verification email',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to sign out',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, alignItems: 'center' }}>
        <View className="w-20 h-20 bg-primary-50 dark:bg-primary-950 rounded-full items-center justify-center mb-6 shadow-sm">
          <Ionicons name="mail-open" size={48} color="#4F46E5" />
        </View>

        <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Verify your Email
        </Text>

        <Text className="text-gray-600 dark:text-gray-400 text-center mb-8 px-4 text-base leading-6">
          We have sent a verification link to your college email address:
          {'\n'}
          <Text className="font-semibold text-primary-600 dark:text-primary-400">{user?.email}</Text>
          {'\n\n'}
          Please check your inbox and click the link to activate your account.
        </Text>

        <View className="w-full space-y-4">
          <TouchableOpacity
            onPress={checkVerificationStatus}
            disabled={isChecking}
            className="w-full bg-primary-600 rounded-xl py-4 items-center flex-row justify-center shadow-md shadow-primary-200 dark:shadow-none"
          >
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" className="mr-2" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" className="mr-2" />
            )}
            <Text className="text-white font-semibold text-lg">I've Verified My Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={isResending || cooldown > 0}
            className={`w-full border border-gray-300 dark:border-gray-700 rounded-xl py-4 items-center flex-row justify-center ${
              cooldown > 0 ? 'bg-gray-50 dark:bg-gray-800 border-none' : ''
            }`}
          >
            {isResending && <ActivityIndicator color="#4F46E5" className="mr-2" />}
            <Ionicons
              name="reload-outline"
              size={20}
              color={cooldown > 0 ? '#9CA3AF' : '#4F46E5'}
              className="mr-2"
            />
            <Text className={`font-semibold text-base ${cooldown > 0 ? 'text-gray-400' : 'text-primary-600'}`}>
              {cooldown > 0 ? `Resend Link in ${cooldown}s` : 'Resend Verification Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="w-full items-center py-3 flex-row justify-center"
          >
            <Ionicons name="arrow-back-outline" size={18} color="#9CA3AF" className="mr-1" />
            <Text className="text-gray-500 dark:text-gray-400 font-medium text-base">
              Change email / Register again
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
