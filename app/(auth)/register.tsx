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
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password, name);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Registration failed',
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
          <Text className="text-4xl font-bold text-primary-600 mb-2">Campus Connect</Text>
          <Text className="text-gray-600 dark:text-gray-400">Join your campus community</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Full Name</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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

          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Password</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Confirm Password</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className="bg-primary-600 rounded-xl py-4 items-center"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-lg">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-gray-600 dark:text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-primary-600 font-medium">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
