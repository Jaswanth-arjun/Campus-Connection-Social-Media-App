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
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please fill in all fields',
      });
      return;
    }

    // Strict NBKRIST college email check: must end with @nbkrist.org
    const isCollegeEmail = email.toLowerCase().endsWith('@nbkrist.org');

    if (!isCollegeEmail) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please use your valid NBKRIST email (e.g. rollnumber@nbkrist.org)',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Match Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Complexity Error',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password, name);
      Toast.show({
        type: 'success',
        text1: 'Account Created',
        text2: 'Verification link sent to your college mail ID!',
      });
      router.replace('/(auth)/verify-email');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-primary-600 rounded-2xl items-center justify-center shadow-lg shadow-primary-300 dark:shadow-none mb-4 rotate-12">
            <Ionicons name="school" size={32} color="#FFFFFF" className="-rotate-12" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Join Campus Connect
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm px-4">
            Connect with your fellow classmates and get real-time university updates.
          </Text>
        </View>

        {/* Registration Card */}
        <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <Text className="text-xl font-bold text-slate-850 dark:text-white mb-6">
            Create Account
          </Text>

          <View className="space-y-4">
            {/* Full Name Input */}
            <View>
              <Text className="text-slate-700 dark:text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                Full Name
              </Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <Ionicons name="person" size={20} color="#94A3B8" className="mr-3" />
                <TextInput
                  className="flex-1 text-slate-900 dark:text-white text-base py-0.5"
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-slate-700 dark:text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                College Email Address
              </Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <Ionicons name="mail" size={20} color="#94A3B8" className="mr-3" />
                <TextInput
                  className="flex-1 text-slate-900 dark:text-white text-base py-0.5"
                  placeholder="rollnumber@nbkrist.org"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 ml-1">
                A verification link will be sent to this ID.
              </Text>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-slate-700 dark:text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <Ionicons name="lock-closed" size={20} color="#94A3B8" className="mr-3" />
                <TextInput
                  className="flex-1 text-slate-900 dark:text-white text-base py-0.5"
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text className="text-slate-700 dark:text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                Confirm Password
              </Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <Ionicons name="lock-closed" size={20} color="#94A3B8" className="mr-3" />
                <TextInput
                  className="flex-1 text-slate-900 dark:text-white text-base py-0.5"
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="bg-primary-600 rounded-2xl py-4 items-center flex-row justify-center mt-4 shadow-lg shadow-primary-200 dark:shadow-none"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-base mr-2">Create Account</Text>
                  <Ionicons name="person-add" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-center mt-8">
          <Text className="text-slate-500 dark:text-slate-400">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-primary-600 dark:text-primary-400 font-semibold">Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
