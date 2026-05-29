import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email',
      });
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword(email);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password reset email sent',
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send reset email',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView className="flex-1" contentContainerClassName="flex-1 justify-center p-6">
        <View className="mb-8">
          <Text className="text-4xl font-bold text-primary-600 mb-2">Reset Password</Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Enter your email to receive a password reset link
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Email</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            className="bg-primary-600 rounded-xl py-4 items-center"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-lg">Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="self-center mt-4">
            <Text className="text-primary-600 font-medium">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
