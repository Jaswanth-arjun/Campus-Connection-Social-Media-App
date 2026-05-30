import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
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
  const user = auth?.currentUser;

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
      const updatedUser = auth?.currentUser;

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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-24 h-24 bg-white/40 border border-white/60 rounded-full items-center justify-center mb-6 shadow-lg shadow-purple-950/10 rotate-6">
          <Ionicons name="mail-open-outline" size={54} color="#6A2FF9" className="-rotate-6" />
        </View>

        <Text className="text-4xl font-extrabold text-[#3B1480] text-center mb-4 tracking-tight" style={{ fontWeight: '900' }}>
          Verify your Email
        </Text>

        <Text className="text-[#5C24B3] text-center mb-8 px-4 text-base leading-6 font-semibold" style={{ fontWeight: '600' }}>
          We have sent a verification link to your college email address:
          {'\n'}
          <Text className="font-extrabold text-[#3B1480] underline" style={{ fontWeight: '900' }}>{user?.email}</Text>
          {'\n\n'}
          Please check your inbox and click the link to activate your account.
        </Text>

        <View className="w-full space-y-4 px-1">
          {/* Main Action: I've Verified */}
          <TouchableOpacity
            onPress={checkVerificationStatus}
            disabled={isChecking}
            className="w-full bg-white items-center flex-row justify-center shadow-xl shadow-purple-950/20 active:bg-purple-50"
            style={{ height: 58, borderRadius: 29 }}
          >
            {isChecking ? (
              <ActivityIndicator color="#6A2FF9" className="mr-2" />
            ) : (
              <Ionicons name="checkmark-circle" size={22} color="#6A2FF9" className="mr-2" />
            )}
            <Text className="text-[#6A2FF9] font-black text-lg" style={{ fontWeight: '900', fontSize: 18 }}>I've Verified My Email</Text>
          </TouchableOpacity>

          {/* Secondary Action: Resend Link */}
          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={isResending || cooldown > 0}
            className={`w-full bg-[#5C24B3] border border-white/10 items-center flex-row justify-center ${cooldown > 0 ? 'opacity-60 bg-[#4C1A99]' : ''
              }`}
            style={{ height: 58, borderRadius: 29 }}
          >
            {isResending ? (
              <ActivityIndicator color="#FFFFFF" className="mr-2" />
            ) : (
              <Ionicons
                name="reload"
                size={20}
                color="#FFFFFF"
                className="mr-2"
              />
            )}
            <Text className="font-black text-lg text-white" style={{ fontWeight: '900', fontSize: 18 }}>
              {cooldown > 0 ? `Resend Link in ${cooldown}s` : 'Resend Verification Link'}
            </Text>
          </TouchableOpacity>

          {/* Change email or Register again */}
          <TouchableOpacity
            onPress={handleLogout}
            className="w-full items-center py-4 flex-row justify-center mt-2"
          >
            <Ionicons name="arrow-back" size={18} color="#6A2FF9" className="mr-1.5" />
            <Text className="text-[#6A2FF9] font-black text-sm underline" style={{ fontWeight: '900' }}>
              Change email / Register again
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

