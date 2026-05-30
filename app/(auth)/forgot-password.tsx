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
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

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
      await authService.resetPassword(email);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password reset email sent to your NBKRIST mail ID',
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
        {/* Back navigation button */}
        <View className="absolute top-12 left-6">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/40 items-center justify-center border border-white/60"
          >
            <Ionicons name="chevron-back" size={20} color="#6A2FF9" />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-10 mt-12">
          <View className="w-20 h-20 bg-white/40 rounded-3xl items-center justify-center border border-white/60 mb-5 shadow-lg shadow-purple-950/10 rotate-12">
            <Ionicons name="lock-open-outline" size={40} color="#6A2FF9" className="-rotate-12" />
          </View>
          <Text className="text-4xl font-extrabold text-[#3B1480] tracking-tight text-center" style={{ fontWeight: '900' }}>
            Reset Your Password
          </Text>
          <Text className="text-[#5C24B3] mt-2 text-center text-sm font-semibold px-4" style={{ fontWeight: 'bold' }}>
            Enter your college email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        <View className="space-y-6 px-1">
          <View>
            <Text className="text-[#3B1480] text-xs font-black uppercase tracking-widest mb-2.5 ml-1" style={{ fontWeight: '900' }}>
              College Email Address
            </Text>
            <View className="flex-row items-center bg-[#5C24B3] border border-white/10 rounded-3xl px-5 py-4.5 shadow-inner">
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
                style={{ fontWeight: '600' }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            className="bg-white items-center flex-row justify-center mt-6 shadow-xl shadow-purple-950/20 active:bg-purple-50"
            style={{ paddingVertical: 18, borderRadius: 28 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#6A2FF9" />
            ) : (
              <>
                <Text className="text-[#6A2FF9] font-black text-lg mr-2" style={{ fontWeight: '900', fontSize: 18 }}>Send Reset Link</Text>
                <Ionicons name="paper-plane-outline" size={18} color="#6A2FF9" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="self-center mt-6">
            <Text className="text-[#6A2FF9] font-black text-base underline" style={{ fontWeight: '900' }}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

