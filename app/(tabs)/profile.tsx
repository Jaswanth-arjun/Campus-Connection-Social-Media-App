import React, { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
WebBrowser.maybeCompleteAuthSession();
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAuth as useClerkAuth, useOAuth as useClerkOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../../components/UserAvatar';
import { Config } from '../../constants/config';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../../services/storageService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { router } from 'expo-router';
import { usePosts } from '../../hooks/usePosts';
import { fetchAttendance, fetchMidmarks } from '../../services/academicService';
import { Attendance, Midmarks } from '../../QIK/types';
import {
  DiceBearConfig,
  getDiceBearUrl,
  compileDiceBearAvatar,
  getDefaultConfigForStyle,
  ADVENTURER_OPTIONS,
  AVATAAARS_OPTIONS,
  LORELEI_OPTIONS,
  OPEN_PEEPS_OPTIONS,
  MICAH_OPTIONS,
  TOON_HEAD_OPTIONS,
  BIG_EARS_OPTIONS,
} from '../../utils/avatarGenerator';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateProfile } = useAuth();
  const { posts } = usePosts();
  const userPosts = currentUser ? posts.filter((p) => p.authorId === currentUser.uid) : [];

  const { isSignedIn: isClerkSignedIn, getToken: getClerkToken } = useClerkAuth();
  const { startOAuthFlow } = useClerkOAuth({ strategy: 'oauth_google' });

  const { isDark, toggleDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editDepartment, setEditDepartment] = useState(currentUser?.department || '');
  const [editYear, setEditYear] = useState(currentUser?.year || '');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editPulseAvatar, setEditPulseAvatar] = useState<string | null>(null);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Academic Dashboard States
  const [attendanceData, setAttendanceData] = useState<Attendance | null>(null);
  const [midmarksData, setMidmarksData] = useState<Midmarks | null>(null);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMidmarksModal, setShowMidmarksModal] = useState(false);
  const [academicRollNumber, setAcademicRollNumber] = useState('');
  const [academicIsMock, setAcademicIsMock] = useState(false);

  // Custom Overrides States
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<Array<{ subject: string; attended: number; conducted: number }>>([]);
  const [showCustomizeMarksModal, setShowCustomizeMarksModal] = useState(false);
  const [customMarks, setCustomMarks] = useState<Array<{ subject: string; M1: number | null; M2: number | null; type: string }>>([]);

  // Avatar Builder States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeAvatarTab, setActiveAvatarTab] = useState<'artStyle' | 'gender' | 'features' | 'accessories'>('artStyle');
  const [isCompilingAvatar, setIsCompilingAvatar] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<DiceBearConfig>({
    style: 'adventurer',
    gender: 'male',
    hair: 'short01',
    hairColor: '09090b',
    skinColor: 'f5c0b1',
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'smile',
    glasses: 'none',
    bgColor: 'c0aede',
    shirtColor: '4f46e5',
  });

  const handlePickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.3,
    });

    if (!result.canceled && result.assets[0]) {
      setEditCover(result.assets[0].uri);
    }
  };

  const handlePickCover = async () => {
    if (!currentUser) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.3,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        Toast.show({ type: 'info', text1: 'Uploading...', text2: 'Saving cover photo' });
        const uploadedUrl = await storageService.uploadImage(
          result.assets[0].uri,
          `covers/${currentUser.uid}/${Date.now()}`
        );
        await updateProfile({ coverImage: uploadedUrl });
        Toast.show({ type: 'success', text1: 'Success', text2: 'Cover photo updated! 🎉' });
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: e.message || 'Could not save cover image' });
      }
    }
  };

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

  const getRollNumber = () => {
    const email = currentUser?.email || '';
    if (!email) return '';
    const prefix = email.split('@')[0];
    return prefix.toUpperCase();
  };

  const getYearSemText = (ybs?: string) => {
    if (!ybs) return '';
    const parts = ybs.split('_');
    if (parts.length < 2) return '';
    const yearNum = parts[0];
    const branchName = parts[1];
    
    const yearText = yearNum === '1' ? '1st Year' : yearNum === '2' ? '2nd Year' : yearNum === '3' ? '3rd Year' : '4th Year';
    const semText = yearNum === '1' ? 'II Sem' : yearNum === '2' ? 'IV Sem' : yearNum === '3' ? 'VI Sem' : 'VIII Sem';
    
    return `${yearText} - ${semText} (${branchName})`;
  };

  const handleEnsureClerkAuth = async (): Promise<string | null> => {
    if (isClerkSignedIn) {
      try {
        const token = await getClerkToken();
        if (token) return token;
      } catch (err) {
        console.warn('[Clerk] Token retrieval error:', err);
      }
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Sync Live Academic Data',
        'To fetch live, accurate attendance and marks from the college website, please sign in with your college Google account via Clerk.',
        [
          {
            text: 'Skip & View Simulated',
            onPress: () => resolve(null),
            style: 'cancel',
          },
          {
            text: 'Sign In',
            onPress: async () => {
              try {
                const { createdSessionId, setActive } = await startOAuthFlow({
                  redirectUrl: Linking.createURL('oauth-redirect', { scheme: 'campusconnect' }),
                });

                if (createdSessionId && setActive) {
                  await setActive({ session: createdSessionId });
                  setTimeout(async () => {
                    try {
                      const token = await getClerkToken();
                      resolve(token);
                    } catch {
                      resolve(null);
                    }
                  }, 1000);
                } else {
                  resolve(null);
                }
              } catch (err: any) {
                Alert.alert('Sign In Failed', err.message || 'OAuth authentication failed.');
                resolve(null);
              }
            },
          },
        ]
      );
    });
  };

  const handleCheckAttendance = async () => {
    const rollNo = getRollNumber();
    if (!rollNo) {
      Alert.alert('Roll Number Not Found', 'Could not extract roll number from your registration email.');
      return;
    }
    
    try {
      setLoadingAcademic(true);
      setAcademicRollNumber(rollNo);
      
      const token = await handleEnsureClerkAuth();
      const result = await fetchAttendance(rollNo, token);
      // Retrieve local override if exists
      const overrideKey = `mock_attendance_override_${rollNo}`;
      const savedOverride = await AsyncStorage.getItem(overrideKey);
      if (savedOverride) {
        setAttendanceData(JSON.parse(savedOverride));
      } else {
        setAttendanceData(result.data);
      }
      setAcademicIsMock(result.isMock);
      setShowAttendanceModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fetch attendance data.');
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleCheckMidMarks = async () => {
    const rollNo = getRollNumber();
    if (!rollNo) {
      Alert.alert('Roll Number Not Found', 'Could not extract roll number from your registration email.');
      return;
    }
    
    try {
      setLoadingAcademic(true);
      setAcademicRollNumber(rollNo);
      
      const token = await handleEnsureClerkAuth();
      const result = await fetchMidmarks(rollNo, token);
      // Retrieve local override if exists
      const overrideKey = `mock_midmarks_override_${rollNo}`;
      const savedOverride = await AsyncStorage.getItem(overrideKey);
      if (savedOverride) {
        setMidmarksData(JSON.parse(savedOverride));
      } else {
        setMidmarksData(result.data);
      }
      setAcademicIsMock(result.isMock);
      setShowMidmarksModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fetch mid marks data.');
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleOpenCustomizeSimulatedData = () => {
    if (attendanceData) {
      setCustomSubjects(
        attendanceData.subjects.map((s) => ({
          subject: s.subject,
          attended: s.attended,
          conducted: s.conducted,
        }))
      );
      setShowCustomizeModal(true);
    }
  };

  const handleUpdateCustomSubject = (index: number, field: 'attended' | 'conducted', valStr: string) => {
    const num = parseInt(valStr) || 0;
    const updated = [...customSubjects];
    updated[index] = {
      ...updated[index],
      [field]: num,
    };
    setCustomSubjects(updated);
  };

  const handleSaveCustomStats = async () => {
    for (const sub of customSubjects) {
      if (sub.attended > sub.conducted) {
        Alert.alert('Invalid Entry', `${sub.subject}: Attended classes cannot exceed conducted classes.`);
        return;
      }
      if (sub.conducted <= 0) {
        Alert.alert('Invalid Entry', `${sub.subject}: Conducted classes must be greater than zero.`);
        return;
      }
    }

    const totalAttended = customSubjects.reduce((acc, s) => acc + s.attended, 0);
    const totalConducted = customSubjects.reduce((acc, s) => acc + s.conducted, 0);
    const overallPercent = parseFloat(((totalAttended / totalConducted) * 100).toFixed(1));

    const newAttendanceData: Attendance = {
      rollno: academicRollNumber,
      year_branch_section: attendanceData?.year_branch_section || '',
      percentage: overallPercent,
      totalClasses: {
        attended: totalAttended,
        conducted: totalConducted,
      },
      subjects: customSubjects.map((s) => ({
        subject: s.subject,
        attended: s.attended,
        conducted: s.conducted,
        lastUpdated: new Date().toISOString().split('T')[0],
      })),
    };

    try {
      const overrideKey = `mock_attendance_override_${academicRollNumber}`;
      await AsyncStorage.setItem(overrideKey, JSON.stringify(newAttendanceData));
      setAttendanceData(newAttendanceData);
      setShowCustomizeModal(false);
      Toast.show({
        type: 'success',
        text1: 'Academic Stats Synchronized',
        text2: 'Offline simulated data updated successfully!',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to save custom stats.');
    }
  };

  const handleOpenCustomizeMarks = () => {
    if (midmarksData) {
      setCustomMarks(
        midmarksData.subjects.map((s) => ({
          subject: s.subject,
          M1: s.M1,
          M2: s.M2,
          type: s.type,
        }))
      );
      setShowCustomizeMarksModal(true);
    }
  };

  const handleUpdateCustomMark = (index: number, field: 'M1' | 'M2', valStr: string) => {
    const num = valStr === '' ? null : parseInt(valStr);
    const updated = [...customMarks];
    updated[index] = {
      ...updated[index],
      [field]: num,
    };
    setCustomMarks(updated);
  };

  const handleSaveCustomMarks = async () => {
    for (const sub of customMarks) {
      if (sub.M1 !== null && (sub.M1 < 0 || sub.M1 > 30)) {
        Alert.alert('Invalid Entry', `${sub.subject}: Mid-1 marks must be between 0 and 30.`);
        return;
      }
      if (sub.M2 !== null && (sub.M2 < 0 || sub.M2 > 30)) {
        Alert.alert('Invalid Entry', `${sub.subject}: Mid-2 marks must be between 0 and 30.`);
        return;
      }
    }

    const newMidmarksData: Midmarks = {
      rollno: academicRollNumber,
      year_branch_section: midmarksData?.year_branch_section || '',
      subjects: customMarks.map((s) => {
        let avg: number | null = null;
        if (s.M1 !== null && s.M2 !== null) {
          avg = (s.M1 + s.M2) / 2;
        } else if (s.M1 !== null) {
          avg = s.M1;
        } else if (s.M2 !== null) {
          avg = s.M2;
        }
        return {
          subject: s.subject,
          M1: s.M1,
          M2: s.M2,
          average: avg !== null ? parseFloat(avg.toFixed(1)) : null,
          type: s.type,
        };
      }),
    };

    try {
      const overrideKey = `mock_midmarks_override_${academicRollNumber}`;
      await AsyncStorage.setItem(overrideKey, JSON.stringify(newMidmarksData));
      setMidmarksData(newMidmarksData);
      setShowCustomizeMarksModal(false);
      Toast.show({
        type: 'success',
        text1: 'Mid Marks Synchronized',
        text2: 'Offline simulated data updated successfully!',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to save custom marks.');
    }
  };

  const handleSaveAvatarDirectly = async (avatarUrl: string, pulseAvatarUrl: string) => {
    if (!currentUser) return;
    try {
      setIsSaving(true);
      Toast.show({ type: 'info', text1: 'Saving...', text2: 'Updating avatar' });
      await updateProfile({
        avatar: avatarUrl,
        pulseAvatar: pulseAvatarUrl,
      });
      Toast.show({
        type: 'success',
        text1: 'Avatar Updated 🎉',
        text2: 'Saved successfully!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.message || 'Could not save avatar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickAvatarOption = () => {
    Alert.alert(
      'Profile Picture',
      'Choose how you want to set your profile picture:',
      [
        {
          text: '🎨 Create 2D Vector Avatar',
          onPress: () => {
            setAvatarConfig(getDefaultConfigForStyle('adventurer', 'male'));
            setShowAvatarModal(true);
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: handlePickAvatar,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePickAvatar = async () => {
    if (!currentUser) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Compressed for fast Firestore profile avatar storage
    });

    if (!result.canceled && result.assets[0]) {
      if (showEditModal) {
        setEditAvatar(result.assets[0].uri);
      } else {
        try {
          setIsSaving(true);
          Toast.show({ type: 'info', text1: 'Uploading...', text2: 'Saving profile picture' });
          const uploadedUrl = await storageService.uploadImage(
            result.assets[0].uri,
            `avatars/${currentUser.uid}/${Date.now()}`
          );
          await updateProfile({ avatar: uploadedUrl });
          Toast.show({ type: 'success', text1: 'Success', text2: 'Profile picture updated! 🎉' });
        } catch (e: any) {
          Toast.show({ type: 'error', text1: 'Upload Failed', text2: e.message || 'Could not save profile picture' });
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      setIsSaving(true);
      let avatarUrl = currentUser.avatar;
      let pulseAvatarUrl = currentUser.pulseAvatar || '';
      let coverUrl = currentUser.coverImage || '';

      if (editAvatar) {
        if (editAvatar.startsWith('data:')) {
          avatarUrl = editAvatar;
        } else if (editAvatar.startsWith('https://api.dicebear.com')) {
          // Compile DiceBear URL to permanent base64 PNG
          try {
            avatarUrl = await compileDiceBearAvatar({ style: 'adventurer', gender: 'male', hair: '', hairColor: '', skinColor: '', eyes: '', eyebrows: '', mouth: '', glasses: '', bgColor: '', shirtColor: '' });
            // Actually use the already-set editAvatar URL to fetch
            const resp = await fetch(editAvatar);
            const blob = await resp.blob();
            avatarUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to compile avatar'));
              reader.readAsDataURL(blob);
            });
          } catch {
            avatarUrl = editAvatar; // Fallback to raw URL
          }
        } else {
          try {
            avatarUrl = await storageService.uploadImage(
              editAvatar,
              `avatars/${currentUser.uid}/${Date.now()}`
            );
          } catch (e) {
            avatarUrl = editAvatar;
          }
        }
      }

      if (editPulseAvatar) {
        if (editPulseAvatar.startsWith('data:')) {
          pulseAvatarUrl = editPulseAvatar;
        } else if (editPulseAvatar.startsWith('https://api.dicebear.com')) {
          // Compile DiceBear URL to permanent base64 PNG
          try {
            const resp = await fetch(editPulseAvatar);
            const blob = await resp.blob();
            pulseAvatarUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to compile pulse avatar'));
              reader.readAsDataURL(blob);
            });
          } catch {
            pulseAvatarUrl = editPulseAvatar; // Fallback to raw URL
          }
        } else {
          try {
            pulseAvatarUrl = await storageService.uploadImage(
              editPulseAvatar,
              `pulse_avatars/${currentUser.uid}/${Date.now()}`
            );
          } catch (e) {
            pulseAvatarUrl = editPulseAvatar;
          }
        }
      }

      if (editCover) {
        if (editCover.startsWith('data:') || editCover.startsWith('https://api.dicebear.com')) {
          coverUrl = editCover;
        } else {
          try {
            coverUrl = await storageService.uploadImage(
              editCover,
              `covers/${currentUser.uid}/${Date.now()}`
            );
          } catch (e) {
            coverUrl = editCover;
          }
        }
      }

      await updateProfile({
        name: editName,
        bio: editBio,
        department: editDepartment,
        year: editYear,
        avatar: avatarUrl,
        coverImage: coverUrl,
        pulseAvatar: pulseAvatarUrl,
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
      <View className="flex-1 bg-themeBgLight dark:bg-slate-950 p-4 pt-12">
        <SkeletonLoader type="profile" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-themeBgLight dark:bg-slate-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Profile Navigation Header */}
      <View 
        className="bg-white dark:bg-slate-900 px-5 pb-4 border-b border-purple-100/70 dark:border-purple-900/30 shadow-md shadow-purple-950/5 flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 items-center justify-center border border-purple-100 dark:border-purple-800/40"
        >
          <Ionicons name="arrow-back" size={20} color="#6A2FF9" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
          Profile Hub
        </Text>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            onPress={toggleDarkMode}
            className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 items-center justify-center border border-purple-100 dark:border-purple-800/40"
          >
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color="#6A2FF9" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleLogout}
            className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 items-center justify-center border border-red-100 dark:border-red-800/40"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 bg-themeBgLight dark:bg-slate-950" showsVerticalScrollIndicator={false}>
        {/* LinkedIn-Style Cover Banner Container */}
        <View className="relative w-full h-44 bg-slate-200">
          <Image 
            source={{ uri: currentUser.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800' }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          <TouchableOpacity 
            onPress={handlePickCover}
            className="absolute top-3 right-3 bg-black/50 w-9 h-9 rounded-full items-center justify-center border border-white/20 active:opacity-80 shadow-md"
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Overlapping Centered Profile Avatar (display only) */}
          <View 
            className="absolute -bottom-14 w-28 h-28 rounded-full border-4 border-white bg-slate-50 shadow-lg"
            style={{ left: '50%', marginLeft: -56 }}
          >
            <View className="w-full h-full rounded-full overflow-hidden">
              <UserAvatar uri={currentUser.avatar} size={112} />
            </View>
          </View>
        </View>

        {/* User Details & Biography Card */}
        <View className="pt-16 items-center px-6">
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
            {currentUser.name}
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 font-extrabold text-[11px] uppercase tracking-wider mt-0.5 text-center">
            {currentUser.email}
          </Text>
          
          {currentUser.bio ? (
            <Text className="text-slate-600 dark:text-slate-300 text-center mt-3.5 px-4 text-sm leading-5 font-medium">
              {currentUser.bio}
            </Text>
          ) : (
            <Text className="text-slate-400 dark:text-slate-500 text-center mt-3.5 px-4 text-xs italic">
              No biography details added. Tap the edit button to complete your profile!
            </Text>
          )}

          {/* Action Buttons */}
          <View className="w-full mt-6 px-4">
            <TouchableOpacity
              onPress={() => {
                setEditName(currentUser.name);
                setEditBio(currentUser.bio);
                setEditDepartment(currentUser.department);
                setEditYear(currentUser.year);
                setEditAvatar(null);
                setEditPulseAvatar(null);
                setEditCover(null);
                setShowEditModal(true);
              }}
              className="w-full bg-[#6A2FF9]/10 py-3.5 rounded-2xl items-center justify-center border border-[#6A2FF9]/20 active:opacity-90 flex-row"
            >
              <Ionicons name="create-outline" size={17} color="#6A2FF9" style={{ marginRight: 6 }} />
              <Text className="text-[#6A2FF9] font-black text-sm">Edit Profile</Text>
            </TouchableOpacity>

            <View className="flex-row items-center mt-3.5 space-x-3 w-full">
              <TouchableOpacity
                onPress={handleCheckAttendance}
                disabled={loadingAcademic}
                className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 py-3.5 rounded-2xl items-center justify-center border border-emerald-200 dark:border-emerald-800/50 active:opacity-90 flex-row"
              >
                {loadingAcademic ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={17} color="#059669" style={{ marginRight: 6 }} />
                    <Text className="text-emerald-700 dark:text-emerald-400 font-black text-sm">Attendance</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCheckMidMarks}
                disabled={loadingAcademic}
                className="flex-1 bg-blue-50 dark:bg-blue-950/30 py-3.5 rounded-2xl items-center justify-center border border-blue-200 dark:border-blue-800/50 active:opacity-90 flex-row"
              >
                {loadingAcademic ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <Ionicons name="bar-chart-outline" size={17} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text className="text-blue-700 dark:text-blue-400 font-black text-sm">Mid Marks</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats & Metadata Counts */}
        <View className="flex-row border-y border-slate-100 my-6 py-4.5 bg-slate-50/50 justify-around">
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-slate-800">{userPosts.length}</Text>
            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mt-0.5">Posts</Text>
          </View>
          <View className="items-center flex-1 border-x border-slate-100">
            <Text className="text-sm font-extrabold text-[#6A2FF9] px-2 text-center" numberOfLines={1}>
              {currentUser.department || 'Student'}
            </Text>
            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mt-1">Dept</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-slate-800">{currentUser.year || 'General'}</Text>
            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mt-0.5">Year</Text>
          </View>
        </View>

        {/* Instagram-Style Posts Grid */}
        <View className="px-4 pb-12">
          <View className="flex-row items-center mb-4.5 px-1 justify-between">
            <Text className="text-slate-900 font-extrabold text-lg tracking-tight">
              Your Campus Posts
            </Text>
            <Ionicons name="grid-outline" size={18} color="#6A2FF9" />
          </View>

          {userPosts.length === 0 ? (
            <View className="items-center justify-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <Ionicons name="images-outline" size={32} color="#94A3B8" />
              <Text className="text-slate-500 font-extrabold text-sm mt-2">No Posts Yet</Text>
              <Text className="text-slate-400 font-semibold text-xs mt-0.5">Share campus moments to see them here!</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => {
                    Alert.alert(
                      "Post Detail",
                      post.content,
                      [{ text: "Close", style: "cancel" }]
                    );
                  }}
                  className="w-[31.3%] aspect-square m-[1%] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm active:opacity-90"
                >
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="bg-[#6A2FF9]/5 border border-[#6A2FF9]/10 w-full h-full p-2.5 items-center justify-center">
                      <Text className="text-[10px] font-extrabold text-[#6A2FF9] text-center" numberOfLines={4}>
                        {post.content}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* App Version */}
        <Text className="text-center text-xs font-bold text-slate-400 mb-8">
          Campus Connect v1.0.0
        </Text>
      </ScrollView>


      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-slate-900"
        >
          {/* Modal Header */}
          <View 
            className="flex-row items-center justify-between px-5 pb-4 border-b border-slate-100"
            style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
          >
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-slate-500 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-slate-900">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isSaving}
              className="bg-[#6A2FF9] px-5 py-2.5 rounded-full"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-extrabold text-sm">Save</Text>
              )}
            </TouchableOpacity>
          </View>


          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
             {/* Beautiful Side-by-Side Photo & Avatar Studio Pickers */}
            <View className="flex-row justify-around items-center mb-8 bg-[#6A2FF9]/5 p-5 rounded-3xl border border-[#6A2FF9]/10">
              {/* Avatar Picker */}
              <TouchableOpacity onPress={handlePickAvatar} className="items-center flex-1">
                <UserAvatar uri={editAvatar || currentUser.avatar} size={76} />
                <Text className="text-[#6A2FF9] mt-2 font-extrabold text-xs uppercase tracking-wider text-center">
                  Change Photo
                </Text>
              </TouchableOpacity>

              {/* Divider line */}
              <View className="w-[1px] h-14 bg-[#6A2FF9]/15" />

              {/* Avatar Builder */}
              <TouchableOpacity
                onPress={() => {
                  setAvatarConfig(getDefaultConfigForStyle('adventurer', 'male'));
                  setShowAvatarModal(true);
                }}
                className="items-center flex-1"
              >
                <View 
                  className="rounded-full bg-[#6A2FF9]/10 items-center justify-center border border-[#6A2FF9]/20 overflow-hidden"
                  style={{ width: 76, height: 76 }}
                >
                  {editPulseAvatar || currentUser.pulseAvatar ? (
                    <Image
                      source={{ uri: editPulseAvatar || currentUser.pulseAvatar }}
                      style={{ width: 76, height: 76 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="sparkles" size={32} color="#6A2FF9" />
                  )}
                </View>
                <Text className="text-[#6A2FF9] mt-2 font-extrabold text-xs uppercase tracking-wider text-center">
                  Edit Avatar
                </Text>
              </TouchableOpacity>
            </View>

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

      {/* 2D Vector Avatar Builder Modal */}
      <Modal visible={showAvatarModal} animationType="slide">
        <View 
          className="flex-1 bg-slate-950"
          style={{ paddingTop: insets.top > 0 ? insets.top : 20 }}
        >
          {/* Header Controls */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900">
            <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
              <Text className="text-white/60 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-white">Cartoon Avatar Studio</Text>
            <TouchableOpacity
              onPress={async () => {
                setIsCompilingAvatar(true);
                let compiledUrl: string;
                try {
                  compiledUrl = await compileDiceBearAvatar(avatarConfig);
                } catch {
                  compiledUrl = getDiceBearUrl(avatarConfig);
                }
                setIsCompilingAvatar(false);

                Alert.alert(
                  'Set as Profile Photo?',
                  'Would you like to set this new avatar as your main profile picture (DP)?\n\nIf you choose "No, Stories Only", this avatar will only be used for your campus stories and active pulses.',
                  [
                    {
                      text: 'No, Stories Only',
                      onPress: () => {
                        if (showEditModal) {
                          setEditPulseAvatar(compiledUrl);
                          setShowAvatarModal(false);
                          Toast.show({
                            type: 'success',
                            text1: 'Avatar Saved for Stories! 📸✨',
                            text2: 'Saved for campus pulses. Tap Save Profile to apply.',
                          });
                        } else {
                          setShowAvatarModal(false);
                          void handleSaveAvatarDirectly(currentUser.avatar, compiledUrl);
                        }
                      }
                    },
                    {
                      text: 'Yes, Set as Profile DP',
                      style: 'default',
                      onPress: () => {
                        if (showEditModal) {
                          setEditAvatar(compiledUrl);
                          setEditPulseAvatar(compiledUrl);
                          setShowAvatarModal(false);
                          Toast.show({
                            type: 'success',
                            text1: 'Avatar Set as DP! 🎨🌟',
                            text2: 'Saved as profile photo. Tap Save Profile to apply.',
                          });
                        } else {
                          setShowAvatarModal(false);
                          void handleSaveAvatarDirectly(compiledUrl, compiledUrl);
                        }
                      }
                    }
                  ],
                  { cancelable: true }
                );
              }}
              disabled={isCompilingAvatar}
              className="bg-[#6A2FF9] px-5 py-2.5 rounded-full opacity-100"
              style={isCompilingAvatar ? { opacity: 0.7 } : {}}
            >
              {isCompilingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-extrabold text-sm">Save Avatar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Premium Canvas Live Viewfinder */}
          <View className="items-center justify-center py-10 bg-slate-900 border-b border-white/5 relative">
            <View className="w-36 h-36 rounded-full border-4 border-[#6A2FF9]/50 overflow-hidden bg-slate-800 shadow-2xl shadow-black/80 items-center justify-center">
              {isCompilingAvatar ? (
                <ActivityIndicator size="large" color="#6A2FF9" />
              ) : (
                <Image
                  source={{ uri: getDiceBearUrl(avatarConfig) }}
                  className="w-full h-full"
                  style={{ width: 140, height: 140 }}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-4">
              {avatarConfig.style === 'adventurer'
                ? 'Snapchat Adventurer Style ⚡'
                : avatarConfig.style === 'avataaars'
                ? 'Instagram Minimal Flat Style 🎨'
                : avatarConfig.style === 'open-peeps'
                ? 'Open Peeps Hand-Drawn Style 🧑‍🎨'
                : avatarConfig.style === 'micah'
                ? 'Micah Abstract Geometric Style 💎'
                : avatarConfig.style === 'toon-head'
                ? 'Toon Head Animation Style 🤠'
                : avatarConfig.style === 'big-ears'
                ? 'Big Ears Comic Style 🐰'
                : 'Lorelei Aesthetic Anime Style 💖'}
            </Text>
          </View>

          {/* Premium Category Navigation Tabs */}
          <View className="border-b border-white/5 bg-slate-950">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-4">
              <View className="flex-row space-x-3">
                {[
                  { id: 'artStyle', name: '1. Art Style', icon: 'color-palette-outline' },
                  { id: 'gender', name: '2. Gender & BG', icon: 'people-outline' },
                  { id: 'features', name: '3. Face & Hair', icon: 'happy-outline' },
                  { id: 'accessories', name: '4. Accessories', icon: 'glasses-outline' },
                ].map((tab) => {
                  const isSelected = activeAvatarTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setActiveAvatarTab(tab.id as any)}
                      className="flex-row items-center px-4 py-2 rounded-2xl border"
                      style={{
                        backgroundColor: isSelected ? '#6A2FF9' : 'transparent',
                        borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Ionicons name={tab.icon as any} size={15} color={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} />
                      <Text
                        className="text-xs font-black ml-1.5"
                        style={{ color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}
                      >
                        {tab.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Studio Workspace panels */}
          <ScrollView className="flex-1 p-5 bg-slate-900" showsVerticalScrollIndicator={false}>
            
            {/* Panel 1: Art Style Selection */}
            {activeAvatarTab === 'artStyle' && (
              <View className="space-y-6">
                <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-1">
                  Choose Design Theme
                </Text>
                
                {[
                  {
                    id: 'adventurer',
                    title: '🌟 Adventurer Cartoon',
                    desc: 'Snapchat Bitmoji-inspired Disney 3D style character illustration. Premium depth and stunning detailing.',
                  },
                  {
                    id: 'avataaars',
                    title: '🎨 Modern Minimalist Flat',
                    desc: 'Instagram-inspired aesthetic flat graphics with custom round frames and trendy geometric designs.',
                  },
                  {
                    id: 'toon-head',
                    title: '🤠 Toon Head Animation',
                    desc: 'Modern, high-quality cartoon avatars from popular animated series. Rich details and expressions.',
                  },
                  {
                    id: 'big-ears',
                    title: '🐰 Big Ears Comic',
                    desc: 'Playful, fun comic character profiles with adorable stylized ears and expressive faces.',
                  },
                  {
                    id: 'open-peeps',
                    title: '🧑‍🎨 Open Peeps Hand-Drawn',
                    desc: 'Aesthetic, hand-drawn comic character illustrations (Notion sketch style). Highly artistic and custom.',
                  },
                  {
                    id: 'micah',
                    title: '💎 Micah Abstract Art',
                    desc: 'Modern, flat geometric fashion faces. Distinctly stylish and premium artistic vector profiles.',
                  },
                  {
                    id: 'lorelei',
                    title: '💖 Kawaii Anime / Aesthetic',
                    desc: 'Super cute anime chibi artwork with gorgeous pastel hair dyes and elegant aesthetic details.',
                  },
                ].map((style) => {
                  const isSelected = avatarConfig.style === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      onPress={() => {
                        setAvatarConfig(getDefaultConfigForStyle(style.id as any, avatarConfig.gender));
                      }}
                      className="p-5 rounded-3xl border-2 mb-3 relative"
                      style={{
                        borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.12)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <Text className="text-white font-extrabold text-base mb-1.5">{style.title}</Text>
                      <Text className="text-white/60 text-xs leading-relaxed">{style.desc}</Text>
                      {isSelected && (
                        <View className="absolute top-4 right-4 bg-[#6A2FF9] w-6 h-6 rounded-full items-center justify-center shadow-md">
                          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Panel 2: Gender & Background Setup */}
            {activeAvatarTab === 'gender' && (
              <View className="space-y-6">
                
                {/* Gender Toggle */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Select Gender Base
                  </Text>
                  <View className="flex-row space-x-4">
                    {[
                      { id: 'male', name: 'Male Base', icon: 'male' },
                      { id: 'female', name: 'Female Base', icon: 'female' },
                    ].map((g) => {
                      const isSelected = avatarConfig.gender === g.id;
                      return (
                        <TouchableOpacity
                          key={g.id}
                          onPress={() => {
                            setAvatarConfig(getDefaultConfigForStyle(avatarConfig.style, g.id as any));
                          }}
                          className="flex-1 p-5 rounded-3xl border-2 items-center relative"
                          style={{
                            borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.05)',
                            backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.1)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <Ionicons name={g.icon as any} size={32} color={isSelected ? '#A78BFA' : 'rgba(255,255,255,0.4)'} />
                          <Text className="text-white font-extrabold text-sm mt-3.5">{g.name}</Text>
                          {isSelected && (
                            <View className="absolute top-2 right-2 bg-[#6A2FF9] w-5 h-5 rounded-full items-center justify-center">
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Customizer Solid / Gradient Background */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Solid Portrait Background
                  </Text>
                  <View className="flex-row flex-wrap">
                    {ADVENTURER_OPTIONS.bgColors.map((color) => {
                      const isSelected = avatarConfig.bgColor === color.id;
                      return (
                        <TouchableOpacity
                          key={color.id}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, bgColor: color.id }))}
                          className="items-center m-2"
                        >
                          <View
                            className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-lg"
                            style={{
                              borderColor: isSelected ? '#FFFFFF' : 'transparent',
                              backgroundColor: `#${color.id}`,
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={18} color={color.id === '0f172a' ? '#FFFFFF' : '#000000'} />}
                          </View>
                          <Text className="text-white/40 text-[9px] font-bold mt-1.5">{color.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Panel 3: Face & Hair Styling */}
            {activeAvatarTab === 'features' && (
              <View className="space-y-6">
                
                {/* Skin Complexion Pickers */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Skin Complexion
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(avatarConfig.style === 'adventurer'
                      ? ADVENTURER_OPTIONS.skinColors
                      : avatarConfig.style === 'avataaars'
                      ? AVATAAARS_OPTIONS.skinColors
                      : avatarConfig.style === 'open-peeps'
                      ? OPEN_PEEPS_OPTIONS.skinColors
                      : avatarConfig.style === 'micah'
                      ? MICAH_OPTIONS.skinColors
                      : avatarConfig.style === 'toon-head'
                      ? TOON_HEAD_OPTIONS.skinColors
                      : avatarConfig.style === 'big-ears'
                      ? BIG_EARS_OPTIONS.skinColors
                      : LORELEI_OPTIONS.skinColors
                    ).map((skin) => {
                      const isSelected = avatarConfig.skinColor === skin.value;
                      const displayBg = `#${skin.value}`;
                      return (
                        <TouchableOpacity
                          key={skin.value}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, skinColor: skin.value }))}
                          className="items-center m-2"
                        >
                          <View
                            className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-md"
                            style={{
                              borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.1)',
                              backgroundColor: displayBg,
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                          </View>
                          <Text className="text-white/40 text-[9px] font-bold mt-1.5">{skin.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Dynamic Hairstyles List */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Hairstyle Style ({avatarConfig.gender === 'male' ? 'Male' : 'Female'})
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(avatarConfig.style === 'adventurer'
                      ? (avatarConfig.gender === 'male' ? ADVENTURER_OPTIONS.maleHair : ADVENTURER_OPTIONS.femaleHair)
                      : avatarConfig.style === 'avataaars'
                      ? (avatarConfig.gender === 'male' ? AVATAAARS_OPTIONS.maleHair : AVATAAARS_OPTIONS.femaleHair)
                      : avatarConfig.style === 'open-peeps'
                      ? (avatarConfig.gender === 'male' ? OPEN_PEEPS_OPTIONS.maleHair : OPEN_PEEPS_OPTIONS.femaleHair)
                      : avatarConfig.style === 'micah'
                      ? MICAH_OPTIONS.hair
                      : avatarConfig.style === 'toon-head'
                      ? (avatarConfig.gender === 'male' ? TOON_HEAD_OPTIONS.maleHair : TOON_HEAD_OPTIONS.femaleHair)
                      : avatarConfig.style === 'big-ears'
                      ? (avatarConfig.gender === 'male' ? BIG_EARS_OPTIONS.maleHair : BIG_EARS_OPTIONS.femaleHair)
                      : LORELEI_OPTIONS.hair
                    ).map((hair) => {
                      const isSelected = avatarConfig.hair === hair.id;
                      return (
                        <TouchableOpacity
                          key={hair.id}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, hair: hair.id }))}
                          className="px-4 py-2.5 rounded-2xl m-1.5 border"
                          style={{
                            borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                            backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <Text
                            className="text-xs font-extrabold"
                            style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                          >
                            {hair.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Hair Coloring Dyebox */}
                <View>
                  <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                    Hair Dye Color
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(avatarConfig.style === 'adventurer'
                      ? ADVENTURER_OPTIONS.hairColors
                      : avatarConfig.style === 'avataaars'
                      ? AVATAAARS_OPTIONS.hairColors
                      : avatarConfig.style === 'open-peeps'
                      ? OPEN_PEEPS_OPTIONS.hairColors
                      : avatarConfig.style === 'micah'
                      ? MICAH_OPTIONS.hairColors
                      : avatarConfig.style === 'toon-head'
                      ? TOON_HEAD_OPTIONS.hairColors
                      : avatarConfig.style === 'big-ears'
                      ? BIG_EARS_OPTIONS.hairColors
                      : LORELEI_OPTIONS.hairColors
                    ).map((color) => {
                      const isSelected = avatarConfig.hairColor === color.value;
                      const displayBg = `#${color.value}`;
                      return (
                        <TouchableOpacity
                          key={color.value}
                          onPress={() => setAvatarConfig((prev) => ({ ...prev, hairColor: color.value }))}
                          className="items-center m-2"
                        >
                          <View
                            className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-lg"
                            style={{
                              borderColor: isSelected ? '#FFFFFF' : 'transparent',
                              backgroundColor: displayBg,
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                          </View>
                          <Text className="text-white/40 text-[9px] font-bold mt-1.5">{color.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Facial Eyes & Mouth Expressions */}
                {avatarConfig.style !== 'lorelei' && (
                  <>
                    <View>
                      <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                        {avatarConfig.style === 'open-peeps' ? 'Facial Expression' : 'Eyes Shape & Expression'}
                      </Text>
                      <View className="flex-row flex-wrap">
                        {(avatarConfig.style === 'adventurer'
                          ? ADVENTURER_OPTIONS.eyes
                          : avatarConfig.style === 'avataaars'
                          ? AVATAAARS_OPTIONS.eyes
                          : avatarConfig.style === 'open-peeps'
                          ? OPEN_PEEPS_OPTIONS.eyes
                          : avatarConfig.style === 'micah'
                          ? MICAH_OPTIONS.eyes
                          : avatarConfig.style === 'toon-head'
                          ? TOON_HEAD_OPTIONS.eyes
                          : BIG_EARS_OPTIONS.eyes
                        ).map((eye) => {
                          const isSelected = avatarConfig.eyes === eye.id;
                          return (
                            <TouchableOpacity
                              key={eye.id}
                              onPress={() => setAvatarConfig((prev) => ({ ...prev, eyes: eye.id }))}
                              className="px-4 py-2.5 rounded-2xl m-1.5 border"
                              style={{
                                borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                                backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                              }}
                            >
                              <Text
                                className="text-xs font-extrabold"
                                style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                              >
                                {eye.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {avatarConfig.style !== 'open-peeps' && (
                      <View>
                        <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                          Happy Mouth Shape
                        </Text>
                        <View className="flex-row flex-wrap">
                          {(avatarConfig.style === 'adventurer'
                            ? ADVENTURER_OPTIONS.mouths
                            : avatarConfig.style === 'avataaars'
                            ? AVATAAARS_OPTIONS.mouths
                            : avatarConfig.style === 'micah'
                            ? MICAH_OPTIONS.mouths
                            : avatarConfig.style === 'toon-head'
                            ? TOON_HEAD_OPTIONS.mouths
                            : BIG_EARS_OPTIONS.mouths
                          ).map((m) => {
                            const isSelected = avatarConfig.mouth === m.id;
                            return (
                              <TouchableOpacity
                                key={m.id}
                                onPress={() => setAvatarConfig((prev) => ({ ...prev, mouth: m.id }))}
                                className="px-4 py-2.5 rounded-2xl m-1.5 border"
                                style={{
                                  borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                                  backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                                }}
                              >
                                <Text
                                  className="text-xs font-extrabold"
                                  style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                                >
                                  {m.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Panel 4: Eyewear & Outerwear Clothes */}
            {activeAvatarTab === 'accessories' && (
              <View className="space-y-6">
                
                {/* Glasses / Sunglasses customizers */}
                {avatarConfig.style !== 'lorelei' && avatarConfig.style !== 'toon-head' && avatarConfig.style !== 'big-ears' && (
                  <View>
                    <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                      Eyewear & Glasses Frames
                    </Text>
                    <View className="flex-row flex-wrap">
                      {(avatarConfig.style === 'adventurer'
                        ? ADVENTURER_OPTIONS.glasses
                        : avatarConfig.style === 'avataaars'
                        ? AVATAAARS_OPTIONS.glasses
                        : avatarConfig.style === 'open-peeps'
                        ? OPEN_PEEPS_OPTIONS.glasses
                        : MICAH_OPTIONS.glasses
                      ).map((glass) => {
                        const isSelected = avatarConfig.glasses === glass.id;
                        return (
                          <TouchableOpacity
                            key={glass.id}
                            onPress={() => setAvatarConfig((prev) => ({ ...prev, glasses: glass.id }))}
                            className="px-4 py-2.5 rounded-2xl m-1.5 border"
                            style={{
                              borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                            }}
                          >
                            <Text
                              className="text-xs font-extrabold"
                              style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                            >
                              {glass.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                 {/* Clothes Style Selector (Toon Head style) */}
                {avatarConfig.style === 'toon-head' && (
                  <View className="mb-6">
                    <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                      Outerwear Clothing Style
                    </Text>
                    <View className="flex-row flex-wrap">
                      {TOON_HEAD_OPTIONS.clothes.map((cloth) => {
                        const isSelected = avatarConfig.glasses === cloth.id;
                        return (
                          <TouchableOpacity
                            key={cloth.id}
                            onPress={() => setAvatarConfig((prev) => ({ ...prev, glasses: cloth.id }))}
                            className="px-4 py-2.5 rounded-2xl m-1.5 border"
                            style={{
                              borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? 'rgba(106, 47, 249, 0.16)' : 'rgba(255,255,255,0.03)',
                            }}
                          >
                            <Text
                              className="text-xs font-extrabold"
                              style={{ color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}
                            >
                              {cloth.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Clothing Dress Tshirts (Adventurer/Open Peeps/Micah/Toon Head styles) */}
                {(avatarConfig.style === 'adventurer' || avatarConfig.style === 'open-peeps' || avatarConfig.style === 'micah' || avatarConfig.style === 'toon-head') && (
                  <View>
                    <Text className="text-white/50 font-black text-xs uppercase tracking-widest mb-3">
                      T-Shirt Outerwear Color
                    </Text>
                    <View className="flex-row flex-wrap">
                      {(avatarConfig.style === 'toon-head'
                        ? TOON_HEAD_OPTIONS.clothesColors
                        : ADVENTURER_OPTIONS.shirtColors
                      ).map((color) => {
                        const isSelected = avatarConfig.shirtColor === color.value;
                        return (
                          <TouchableOpacity
                            key={color.value}
                            onPress={() => setAvatarConfig((prev) => ({ ...prev, shirtColor: color.value }))}
                            className="items-center m-2"
                          >
                            <View
                              className="w-12 h-12 rounded-full border-2 items-center justify-center shadow-lg"
                              style={{
                                borderColor: isSelected ? '#FFFFFF' : 'transparent',
                                backgroundColor: `#${color.value}`,
                              }}
                            >
                              {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                            </View>
                            <Text className="text-white/40 text-[9px] font-bold mt-1.5">{color.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View className="pt-6">
                  <Text className="text-white/40 text-center text-xs leading-relaxed">
                    Choose from hundreds of character styles & variations. Save your character design above to immediately update all your live campus pulses!
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Unique Academic Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%] px-6 pt-6 pb-8 shadow-2xl">
            {/* Handle Bar */}
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" style={{ alignSelf: 'center' }} />
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1 mr-2">
                <Text className="text-2xl font-black text-slate-900 tracking-tight">Academic Pulse</Text>
                <Text className="text-slate-400 text-xs font-semibold" numberOfLines={1}>
                  Live Roll: {academicRollNumber} • {getYearSemText(attendanceData?.year_branch_section)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAttendanceModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {academicIsMock && (
              <View className="mb-4 bg-purple-50 border border-purple-100 p-3.5 rounded-2xl">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={18} color="#6A2FF9" />
                  <Text className="text-[#6A2FF9] text-xs font-bold ml-2 flex-1">
                    Connected via Offline Mode. Showing simulated profile stats for college.
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleOpenCustomizeSimulatedData}
                  activeOpacity={0.7}
                  className="mt-2.5 bg-[#6A2FF9]/10 py-2 rounded-xl flex-row items-center justify-center border border-[#6A2FF9]/20"
                >
                  <Ionicons name="create-outline" size={14} color="#6A2FF9" />
                  <Text className="text-[#6A2FF9] text-xs font-black ml-1.5">Customize Simulated Data</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="bg-slate-900 p-6 rounded-3xl mb-6 items-center shadow-xl shadow-slate-950/20">
                {/* Top status indicator row */}
                <View className="w-full flex-row justify-between items-center mb-5">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={18} color="#10B981" />
                    <Text className="text-white font-extrabold text-sm ml-2">Attendance</Text>
                  </View>
                  <View className="flex-row items-center bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                    <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      {attendanceData?.percentage && attendanceData.percentage >= 75 ? 'On Track' : 'Low Attendance'}
                    </Text>
                  </View>
                </View>

                {/* Circular View Indicator (Pure CSS/Borders) */}
                <View className="relative items-center justify-center my-4">
                  {(() => {
                    const pct = attendanceData?.percentage || 0;
                    const strokeColor = pct >= 75 ? '#10B981' : '#F59E0B'; // green or orange
                    const trackColor = '#1E293B'; // slate-800

                    // Map percentage to specific border segment colors
                    const borderTopColor = pct > 0 ? strokeColor : trackColor;
                    const borderRightColor = pct > 25 ? strokeColor : trackColor;
                    const borderBottomColor = pct > 50 ? strokeColor : trackColor;
                    const borderLeftColor = pct > 75 ? strokeColor : trackColor;

                    return (
                      <View 
                        style={{
                          width: 150,
                          height: 150,
                          borderRadius: 75,
                          borderWidth: 12,
                          borderTopColor,
                          borderRightColor,
                          borderBottomColor,
                          borderLeftColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: [{ rotate: '45deg' }]
                        }}
                      >
                        {/* Inner text needs to be counter-rotated back so it's upright */}
                        <View style={{ transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center' }}>
                          <Text className="text-white text-3xl font-black tracking-tight">
                            {pct}
                          </Text>
                          <Text className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider mt-0.5">
                            percent
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Class count summary */}
                <Text className="text-slate-400 text-xs font-semibold mt-4">
                  {attendanceData?.totalClasses.attended} of {attendanceData?.totalClasses.conducted} classes
                </Text>
              </View>

              {/* Subject Breakdown list */}
              <Text className="text-slate-800 font-extrabold text-base mb-4 px-1">Subject Breakdown</Text>
              
              <View className="pb-8">
                {attendanceData?.subjects.map((sub, idx) => {
                  const percent = Math.round((sub.attended / sub.conducted) * 100) || 0;
                  const isGood = percent >= 75;
                  const isWarning = percent >= 65 && percent < 75;
                  const barColorClass = isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500';
                  const textColor = isGood ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-rose-600';

                  return (
                    <View key={idx} className="mb-5 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                      {/* Top line with subject and class fraction */}
                      <View className="flex-row justify-between items-center mb-2.5">
                        <Text className="text-slate-800 font-bold text-sm">{sub.subject}</Text>
                        <Text className="text-slate-400 text-xs font-semibold">
                          {sub.attended}/{sub.conducted}
                        </Text>
                      </View>
                      
                      {/* Bottom line with progress bar and percent */}
                      <View className="flex-row items-center">
                        <View className="flex-1 h-2 bg-slate-200/60 rounded-full mr-3 overflow-hidden">
                          <View className={`h-full ${barColorClass}`} style={{ width: `${percent}%` }} />
                        </View>
                        <Text className={`font-extrabold text-xs ${textColor} w-10 text-right`}>
                          {percent}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unique Academic Mid Marks Modal */}
      <Modal
        visible={showMidmarksModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMidmarksModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%] px-6 pt-6 pb-8 shadow-2xl">
            {/* Handle Bar */}
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" style={{ alignSelf: 'center' }} />
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1 mr-2">
                <Text className="text-2xl font-black text-slate-900 tracking-tight">Mid Term Hub</Text>
                <Text className="text-slate-400 text-xs font-semibold" numberOfLines={1}>
                  Live Roll: {academicRollNumber} • {getYearSemText(midmarksData?.year_branch_section)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMidmarksModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {academicIsMock && (
              <View className="mb-4 bg-purple-50 border border-purple-100 p-3.5 rounded-2xl">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={18} color="#6A2FF9" />
                  <Text className="text-[#6A2FF9] text-xs font-bold ml-2 flex-1">
                    Connected via Offline Mode. Showing simulated profile stats for college.
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleOpenCustomizeMarks}
                  activeOpacity={0.7}
                  className="mt-2.5 bg-[#6A2FF9]/10 py-2 rounded-xl flex-row items-center justify-center border border-[#6A2FF9]/20"
                >
                  <Ionicons name="create-outline" size={14} color="#6A2FF9" />
                  <Text className="text-[#6A2FF9] text-xs font-black ml-1.5">Customize Mid Marks</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {/* Dynamic summary card */}
              <View className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-3xl shadow-xl shadow-blue-900/10 mb-6 relative overflow-hidden">
                <View className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
                <Text className="text-white/80 text-[10px] font-black uppercase tracking-widest font-semibold">Semester Performance</Text>
                
                {/* Compute and display average */}
                {(() => {
                  const subjects = midmarksData?.subjects || [];
                  const averages = subjects.map(s => s.average).filter((v): v is number => v !== null);
                  const totalAvg = averages.length > 0 ? (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1) : 'N/A';
                  return (
                    <View className="flex-row items-baseline mt-1.5">
                      <Text className="text-white text-5xl font-black tracking-tight">{totalAvg}</Text>
                      <Text className="text-white/60 text-xs ml-2 font-bold uppercase tracking-wider">/ 30.0 Average</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Subject wise marks grid */}
              <Text className="text-slate-800 font-extrabold text-base mb-4 px-1">Subject Marks Breakdown</Text>
              
              <View className="pb-8">
                {midmarksData?.subjects.map((sub, idx) => {
                  const getMarksColor = (m: number | null) => {
                    if (m === null) return 'text-slate-400';
                    if (m >= 22.5) return 'text-emerald-500';
                    if (m >= 15) return 'text-amber-500';
                    return 'text-rose-500';
                  };

                  const getAvgBg = (avg: number | null) => {
                    if (avg === null) return 'bg-slate-100 border-slate-200';
                    if (avg >= 22.5) return 'bg-emerald-50 border-emerald-100';
                    if (avg >= 15) return 'bg-amber-50 border-amber-100';
                    return 'bg-rose-50 border-rose-100';
                  };

                  const getAvgText = (avg: number | null) => {
                    if (avg === null) return 'text-slate-600';
                    if (avg >= 22.5) return 'text-emerald-600';
                    if (avg >= 15) return 'text-amber-600';
                    return 'text-rose-600';
                  };

                  return (
                    <View key={idx} className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl shadow-sm mb-4.5">
                      {/* Subject Name & Type */}
                      <View className="flex-row justify-between items-center border-b border-slate-100 pb-2.5 mb-3.5">
                        <View className="flex-1 mr-2">
                          <Text className="text-slate-800 font-black text-sm" numberOfLines={1}>{sub.subject}</Text>
                          <Text className="text-[10px] font-extrabold text-slate-400 mt-0.5 uppercase tracking-wider">{sub.type}</Text>
                        </View>
                        {/* Avg Badge */}
                        <View className={`px-2.5 py-1 rounded-full border ${getAvgBg(sub.average)}`}>
                          <Text className={`font-black text-xs ${getAvgText(sub.average)}`}>
                            Avg: {sub.average !== null ? sub.average.toFixed(1) : '-'}
                          </Text>
                        </View>
                      </View>

                      {/* Mid 1 and Mid 2 Columns */}
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 flex-row items-center justify-start">
                          <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
                            <Ionicons name="document-text-outline" size={13} color="#94A3B8" />
                          </View>
                          <View>
                            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mid 1</Text>
                            <Text className={`font-black text-sm ${getMarksColor(sub.M1)}`}>
                              {sub.M1 !== null ? `${sub.M1} / 30` : 'Not Released'}
                            </Text>
                          </View>
                        </View>

                        <View className="w-[1px] h-6 bg-slate-200 mx-4" />

                        <View className="flex-1 flex-row items-center justify-start">
                          <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
                            <Ionicons name="document-text-outline" size={13} color="#94A3B8" />
                          </View>
                          <View>
                            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mid 2</Text>
                            <Text className={`font-black text-sm ${getMarksColor(sub.M2)}`}>
                              {sub.M2 !== null ? `${sub.M2} / 30` : 'Not Released'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customize Simulated Attendance Modal */}
      <Modal
        visible={showCustomizeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-white rounded-t-[40px] h-[75%] px-6 pt-6 pb-8 shadow-2xl">
            {/* Handle Bar */}
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" style={{ alignSelf: 'center' }} />
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-black text-slate-900 tracking-tight">Customize Attendance</Text>
                <Text className="text-slate-400 text-xs font-semibold">Set actual values for your subjects</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCustomizeModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="pb-8">
                {customSubjects.map((sub, idx) => (
                  <View key={idx} className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl mb-4">
                    <Text className="text-slate-800 font-extrabold text-sm mb-3">{sub.subject}</Text>
                    
                    <View className="flex-row justify-between items-center">
                      {/* Attended classes input */}
                      <View className="flex-1 mr-2">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attended</Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={String(sub.attended)}
                          onChangeText={(val) => handleUpdateCustomSubject(idx, 'attended', val)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold text-sm text-center"
                          placeholder="0"
                        />
                      </View>

                      {/* Slash / spacer */}
                      <Text className="text-slate-300 font-black text-lg mt-4 mx-1">/</Text>

                      {/* Conducted classes input */}
                      <View className="flex-1 ml-2">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Conducted</Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={String(sub.conducted)}
                          onChangeText={(val) => handleUpdateCustomSubject(idx, 'conducted', val)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold text-sm text-center"
                          placeholder="0"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="flex-row gap-3 pt-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => setShowCustomizeModal(false)}
                className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center"
              >
                <Text className="text-slate-500 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCustomStats}
                className="flex-1 bg-[#6A2FF9]/10 py-3.5 rounded-2xl items-center justify-center border border-[#6A2FF9]/20 active:opacity-90"
              >
                <Text className="text-[#6A2FF9] font-black text-sm">Save Stats</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Customize Simulated Mid Marks Modal */}
      <Modal
        visible={showCustomizeMarksModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomizeMarksModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-white rounded-t-[40px] h-[75%] px-6 pt-6 pb-8 shadow-2xl">
            {/* Handle Bar */}
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" style={{ alignSelf: 'center' }} />
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-black text-slate-900 tracking-tight">Customize Mid Marks</Text>
                <Text className="text-slate-400 text-xs font-semibold">Set actual marks out of 30</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCustomizeMarksModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="pb-8">
                {customMarks.map((sub, idx) => (
                  <View key={idx} className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl mb-4">
                    <Text className="text-slate-800 font-extrabold text-sm mb-3">{sub.subject}</Text>
                    
                    <View className="flex-row justify-between items-center">
                      {/* Mid 1 Input */}
                      <View className="flex-1 mr-2">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mid 1 Marks</Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={sub.M1 !== null ? String(sub.M1) : ''}
                          onChangeText={(val) => handleUpdateCustomMark(idx, 'M1', val)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold text-sm text-center"
                          placeholder="0-30"
                          maxLength={2}
                        />
                      </View>

                      {/* Mid 2 Input */}
                      <View className="flex-1 ml-2">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mid 2 Marks</Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={sub.M2 !== null ? String(sub.M2) : ''}
                          onChangeText={(val) => handleUpdateCustomMark(idx, 'M2', val)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold text-sm text-center"
                          placeholder="0-30"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="flex-row gap-3 pt-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => setShowCustomizeMarksModal(false)}
                className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center"
              >
                <Text className="text-slate-500 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCustomMarks}
                className="flex-1 bg-[#6A2FF9]/10 py-3.5 rounded-2xl items-center justify-center border border-[#6A2FF9]/20 active:opacity-90"
              >
                <Text className="text-[#6A2FF9] font-black text-sm">Save Marks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
