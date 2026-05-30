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
      className="flex-1 bg-themeBg"
    >
      <StatusBar barStyle="light-content" />

      {/* Glowing background auras */}
      <View 
        className="absolute bg-[#5C24B3]/25 rounded-full" 
        style={{ width: 300, height: 300, top: -50, right: -50, opacity: 0.8 }} 
      />
      <View 
        className="absolute bg-white/20 rounded-full" 
        style={{ width: 250, height: 250, bottom: -50, left: -50, opacity: 0.6 }} 
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back navigation button */}
        <View className="absolute top-12 left-6">
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/login')} 
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/10"
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Top Header */}
        <View className="items-center mb-8 mt-8">
          <View className="w-20 h-20 bg-white/40 rounded-3xl items-center justify-center border border-white/60 mb-5 shadow-lg shadow-purple-950/10 rotate-12">
            <Ionicons name="school" size={40} color="#6A2FF9" className="-rotate-12" />
          </View>
          <Text className="text-4xl font-extrabold text-[#3B1480] tracking-tight text-center" style={{ fontWeight: '900' }}>
            Create Account
          </Text>
          <Text className="text-[#5C24B3] mt-2 text-center text-sm font-semibold px-6 leading-5" style={{ fontWeight: 'bold' }}>
            Join your fellow students and stay updated on Campus Connect.
          </Text>
        </View>

        {/* Form Container (Direct Layout) */}
        <View className="space-y-4 px-1">
          {/* Full Name Input */}
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ fontWeight: '900' }}>
              Full Name
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/10 rounded-3xl px-5 py-4.5 shadow-inner">
              <Ionicons name="person-outline" size={20} color="#EBE5FF" className="mr-3.5" />
              <TextInput
                className="flex-1 text-white text-base py-0.5 font-semibold"
                placeholder="Rolex Savage"
                placeholderTextColor="#D6C7FF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                style={{ fontWeight: '600' }}
              />
            </View>
          </View>

          {/* Email Input */}
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ fontWeight: '900' }}>
              College Email
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/10 rounded-3xl px-5 py-4.5 shadow-inner">
              <Ionicons name="mail-outline" size={20} color="#EBE5FF" className="mr-3.5" />
              <TextInput
                className="flex-1 text-white text-base py-0.5"
                placeholder="rollnumber@nbkrist.org"
                placeholderTextColor="#D6C7FF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontWeight: '600' }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ fontWeight: '900' }}>
              Password
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/10 rounded-3xl px-5 py-4.5 shadow-inner">
              <Ionicons name="lock-closed-outline" size={20} color="#EBE5FF" className="mr-3.5" />
              <TextInput
                className="flex-1 text-white text-base py-0.5 font-semibold"
                placeholder="••••••••"
                placeholderTextColor="#D6C7FF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontWeight: '600' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#EBE5FF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ fontWeight: '900' }}>
              Confirm Password
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/10 rounded-3xl px-5 py-4.5 shadow-inner">
              <Ionicons name="lock-closed-outline" size={20} color="#EBE5FF" className="mr-3.5" />
              <TextInput
                className="flex-1 text-white text-base py-0.5 font-semibold"
                placeholder="••••••••"
                placeholderTextColor="#D6C7FF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontWeight: '600' }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="pl-2">
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#EBE5FF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button (Gorgeous guaranteed thick white button with bold purple text) */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className="bg-white items-center flex-row justify-center mt-6 shadow-xl shadow-purple-950/20 active:bg-purple-50"
            style={{ paddingVertical: 18, borderRadius: 28 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#6A2FF9" />
            ) : (
              <>
                <Text className="text-[#6A2FF9] font-black text-lg mr-2" style={{ fontWeight: '900', fontSize: 18 }}>Register</Text>
                <Ionicons name="person-add" size={19} color="#6A2FF9" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-center mt-10 mb-6">
          <Text className="text-[#4A1C9E] font-bold text-[14px]" style={{ fontWeight: 'bold' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-[#6A2FF9] font-black text-[14px] underline" style={{ fontWeight: '900' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

