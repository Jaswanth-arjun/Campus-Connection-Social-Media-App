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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import Toast from 'react-native-toast-message';

import { useSignIn } from '@clerk/clerk-expo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { signIn, setActive, isLoaded: isClerkLoaded } = useSignIn();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please fill in all fields',
      });
      return;
    }

    // Strict NBKRIST college email check: must end with @nbkrist.org
    if (!email.toLowerCase().endsWith('@nbkrist.org')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please use your valid NBKRIST email (e.g. rollnumber@nbkrist.org)',
      });
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);

      // Attempt background sign in to Clerk for academic records
      if (isClerkLoaded && signIn) {
        try {
          const signInAttempt = await signIn.create({
            identifier: email,
            password,
          });
          if (signInAttempt.status === 'complete') {
            await setActive({ session: signInAttempt.createdSessionId });
            console.log('[Clerk] Logged in successfully in the background');
          }
        } catch (clerkErr) {
          console.warn('[Clerk] Background sign-in skipped/failed:', clerkErr);
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged in successfully',
      });

      if (auth?.currentUser && !auth.currentUser.emailVerified) {
        router.replace('/(auth)/verify-email');
      } else {
        router.replace('/(tabs)/feed');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Please check your credentials',
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
        style={{ width: 300, height: 300, top: -50, left: -50, opacity: 0.8 }}
      />
      <View
        className="absolute bg-white/20 rounded-full"
        style={{ width: 250, height: 250, bottom: -50, right: -50, opacity: 0.6 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back navigation button if needed, styled premium */}
        <View className="absolute top-12 left-6">
          <TouchableOpacity
            onPress={() => router.replace('/')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/10"
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Top Decorative Blob/Header */}
        <View className="items-center mb-10 mt-12">
          <View className="w-24 h-24 bg-white/40 rounded-3xl items-center justify-center border border-white/60 mb-5 shadow-lg shadow-purple-950/10 rotate-12 overflow-hidden">
            <Image
              source={require('../../assets/images/logo.jpg')}
              className="w-full h-full -rotate-12"
              resizeMode="cover"
            />
          </View>
          <Text className="text-4xl font-extrabold text-[#3B1480] tracking-tight text-center" style={{ fontWeight: '900' }}>
            Welcome Back
          </Text>
          <Text className="text-[#5C24B3] mt-2 text-center text-sm font-semibold px-6 leading-5" style={{ fontWeight: 'bold' }}>
            Connect and collaborate with the exclusive NBKRIST student hub.
          </Text>
        </View>

        {/* Form Container (Direct Layout with rich purple inputs) */}
        <View className="space-y-5 px-1">
          {/* Email Input */}
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2.5 ml-1" style={{ fontWeight: '900' }}>
              College Email
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/20 px-5 shadow-inner" style={{ height: 58, borderRadius: 29 }}>
              <Ionicons name="mail-outline" size={20} color="#EBE5FF" className="mr-3.5" />
              <TextInput
                className="flex-1 text-white text-base py-0.5 font-semibold"
                placeholder="rollnumber@nbkrist.org"
                placeholderTextColor="#D6C7FF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontWeight: '600', height: '100%', fontSize: 16 }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2.5 ml-1" style={{ fontWeight: '900' }}>
              Password
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/20 px-5 shadow-inner" style={{ height: 58, borderRadius: 29 }}>
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
                style={{ fontWeight: '600', height: '100%', fontSize: 16 }}
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            className="self-end pt-1"
          >
            <Text className="text-[#4A1C9E] font-black text-sm underline" style={{ fontWeight: '900' }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Login Button (Gorgeous guaranteed thick white button with bold purple text) */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-white items-center flex-row justify-center mt-6 shadow-xl shadow-purple-950/20 active:bg-purple-50"
            style={{ height: 58, borderRadius: 29 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#6A2FF9" />
            ) : (
              <>
                <Text className="text-[#6A2FF9] font-black text-lg mr-2" style={{ fontWeight: '900', fontSize: 18 }}>Login</Text>
                <Ionicons name="arrow-forward" size={19} color="#6A2FF9" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-center mt-12 mb-6">
          <Text className="text-[#4A1C9E] font-bold text-[14px]" style={{ fontWeight: 'bold' }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-[#6A2FF9] font-black text-[14px] underline" style={{ fontWeight: '900' }}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

