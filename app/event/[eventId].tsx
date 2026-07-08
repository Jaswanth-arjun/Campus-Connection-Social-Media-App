import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { currentEvent, isLoading, fetchEvent, registerForEvent, unregisterForEvent, deleteEvent, registerForEventWithDetails } = useEventStore();

  const [showFormModal, setShowFormModal] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({}); // field.id -> local uri
  const [checkedOptions, setCheckedOptions] = useState<Record<string, string[]>>({}); // field.id -> array of selected options
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const loadRegistrations = async () => {
    if (currentUser?.isAdmin && eventId && typeof eventId === 'string') {
      try {
        setLoadingRegs(true);
        const data = await eventService.fetchEventRegistrations(eventId);
        setRegistrations(data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoadingRegs(false);
      }
    }
  };

  useEffect(() => {
    if (eventId && typeof eventId === 'string') {
      fetchEvent(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    loadRegistrations();
  }, [eventId, currentUser, currentEvent?.registeredUsers]);

  const handleDeleteEvent = () => {
    if (!currentEvent) return;
    Alert.alert(
      'Delete Event',
      'Are you sure you want to permanently delete this event and all its student registration details?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(currentEvent.id, currentEvent.imageUrl);
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Event deleted successfully',
              });
              router.back();
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Failed to delete event',
              });
            }
          }
        }
      ]
    );
  };

  const handlePickFieldImage = async (fieldId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.35,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImages({
        ...selectedImages,
        [fieldId]: result.assets[0].uri,
      });
    }
  };

  const handleToggleCheckbox = (fieldId: string, option: string) => {
    const currentChecked = checkedOptions[fieldId] || [];
    let updated;
    if (currentChecked.includes(option)) {
      updated = currentChecked.filter(o => o !== option);
    } else {
      updated = [...currentChecked, option];
    }
    setCheckedOptions({
      ...checkedOptions,
      [fieldId]: updated,
    });
  };

  const handleRegister = async () => {
    if (!currentUser || !currentEvent) return;

    const isRegistered = currentEvent.registeredUsers.includes(currentUser.uid);

    if (isRegistered) {
      Alert.alert(
        'Unregister from Event',
        'Are you sure you want to unregister from this event?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unregister',
            style: 'destructive',
            onPress: async () => {
              try {
                await unregisterForEvent(currentEvent.id, currentUser.uid);
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Unregistered from event',
                });
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: error.message || 'Failed to update registration',
                });
              }
            },
          },
        ]
      );
    } else {
      if (currentEvent.customFields && currentEvent.customFields.length > 0) {
        const initialResponses: Record<string, string> = {};
        const initialChecked: Record<string, string[]> = {};
        const initialImages: Record<string, string> = {};
        currentEvent.customFields.forEach(f => {
          if (f.type === 'text' || f.type === 'options') {
            initialResponses[f.id] = '';
          } else if (f.type === 'checkbox') {
            initialChecked[f.id] = [];
          } else if (f.type === 'image') {
            initialImages[f.id] = '';
          }
        });
        setFormResponses(initialResponses);
        setCheckedOptions(initialChecked);
        setSelectedImages(initialImages);
        setShowFormModal(true);
      } else {
        Alert.alert(
          'Register for Event',
          'Do you want to register for this event?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Register',
              onPress: async () => {
                try {
                  await registerForEvent(currentEvent.id, currentUser.uid);
                  Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Registered for event',
                  });
                } catch (error: any) {
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to update registration',
                  });
                }
              },
            },
          ]
        );
      }
    }
  };

  const handleSubmitForm = async () => {
    if (!currentUser || !currentEvent) return;

    // Validate fields
    for (const field of currentEvent.customFields || []) {
      if (field.type === 'text' && !formResponses[field.id]?.trim()) {
        Alert.alert('Required Field', `Please fill out: ${field.name}`);
        return;
      }
      if (field.type === 'options' && !formResponses[field.id]) {
        Alert.alert('Required Field', `Please select an option for: ${field.name}`);
        return;
      }
      if (field.type === 'checkbox' && (!checkedOptions[field.id] || checkedOptions[field.id].length === 0)) {
        Alert.alert('Required Field', `Please check at least one option for: ${field.name}`);
        return;
      }
      if (field.type === 'image' && !selectedImages[field.id]) {
        Alert.alert('Required Field', `Please upload a screenshot for: ${field.name}`);
        return;
      }
    }

    try {
      setIsSubmittingForm(true);

      const finalResponses: Record<string, string> = {};
      
      for (const field of currentEvent.customFields || []) {
        if (field.type === 'text' || field.type === 'options') {
          finalResponses[field.name] = formResponses[field.id] || '';
        } else if (field.type === 'checkbox') {
          finalResponses[field.name] = checkedOptions[field.id]?.join(', ') || '';
        } else if (field.type === 'image') {
          const localUri = selectedImages[field.id];
          const storagePath = `registrations/${currentEvent.id}/${currentUser.uid}_${field.id}`;
          const uploadedUrl = await storageService.uploadImage(localUri, storagePath);
          finalResponses[field.name] = uploadedUrl;
        }
      }

      const studentName = currentUser.fullName || currentUser.email?.split('@')[0] || 'Student';
      const studentEmail = currentUser.email || '';
      
      await registerForEventWithDetails(
        currentEvent.id,
        currentUser.uid,
        studentName,
        studentEmail,
        finalResponses
      );
      setShowFormModal(false);
      Toast.show({
        type: 'success',
        text1: 'Registration Successful!',
        text2: 'Your form details have been submitted 🎉',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: err.message || 'Failed to submit form',
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (isLoading && !currentEvent) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-darkBg">
        <ActivityIndicator size="large" color={isDark ? '#A78BFA' : '#8B5CF6'} />
      </View>
    );
  }

  if (!currentEvent) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-darkBg">
        <Text className="text-gray-500 dark:text-slate-400">Event not found</Text>
      </View>
    );
  }

  const isRegistered = currentUser && currentEvent.registeredUsers.includes(currentUser.uid);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-darkBg" showsVerticalScrollIndicator={false}>
      <Image source={{ uri: currentEvent.imageUrl }} className="w-full h-56" resizeMode="cover" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-darkSurface border-b border-slate-100 dark:border-white/[0.06]">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#A78BFA' : '#8B5CF6'} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-900 dark:text-white">Event Details</Text>
        <View className="flex-row items-center space-x-2">
          {currentUser?.isAdmin && (
            <TouchableOpacity onPress={handleDeleteEvent} className="mr-3">
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-white dark:bg-darkSurface p-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{currentEvent.title}</Text>
            <View className="bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-full self-start mt-2">
              <Text className="text-purple-600 dark:text-purple-300 text-sm font-semibold">{currentEvent.category}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center mt-4 mb-2">
          <Ionicons name="calendar-outline" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          <Text className="ml-2 text-gray-700 dark:text-slate-300">
            {format(new Date(currentEvent.date), 'MMMM dd, yyyy • h:mm a')}
          </Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          <Text className="ml-2 text-gray-700 dark:text-slate-300">{currentEvent.location}</Text>
        </View>

        <View className="flex-row items-center mb-4">
          <Ionicons name="person-outline" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          <Text className="ml-2 text-gray-700 dark:text-slate-300">
            {currentEvent.registeredUsers.length} registered
          </Text>
        </View>

        <View className="border-t border-slate-100 dark:border-white/[0.06] pt-4">
          <Text className="font-bold text-gray-900 dark:text-white mb-2">Description</Text>
          <Text className="text-gray-700 dark:text-slate-300">{currentEvent.description}</Text>
        </View>
      </View>

      <View className="bg-white dark:bg-darkSurface p-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <Text className="font-bold text-gray-900 dark:text-white mb-3">Organizer</Text>
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 items-center justify-center">
            <Ionicons name="person" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          </View>
          <Text className="ml-3 text-gray-900 dark:text-white font-medium">{currentEvent.organizer}</Text>
        </View>
      </View>

      {/* Registered Student Submissions for Admin */}
      {currentUser?.isAdmin && (
        <View className="bg-white dark:bg-darkSurface p-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
          <View className="flex-row items-center justify-between mb-3 border-b border-slate-50 dark:border-white/[0.04] pb-2">
            <Text className="font-bold text-gray-900 dark:text-white text-base">Registered Students List</Text>
            <TouchableOpacity onPress={loadRegistrations} disabled={loadingRegs}>
              {loadingRegs ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <Ionicons name="refresh" size={18} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          </View>
          
          {registrations.length === 0 ? (
            <Text className="text-gray-500 dark:text-slate-400 text-sm italic py-2">No students registered yet.</Text>
          ) : (
            <View className="space-y-3">
              {registrations.map((reg) => (
                <View key={reg.id} className="bg-slate-50 dark:bg-darkElevated p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-semibold text-slate-800 dark:text-white text-sm">{reg.userName}</Text>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                      {format(new Date(reg.registeredAt), 'MMM dd, hh:mm a')}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2">{reg.userEmail}</Text>
                  
                  {/* Form Submission Details */}
                  {reg.submittedDetails && Object.keys(reg.submittedDetails).length > 0 && (
                    <View className="bg-white dark:bg-darkSurface p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.06] space-y-2 mt-1">
                      {Object.entries(reg.submittedDetails).map(([key, val]) => {
                        const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
                        return (
                          <View key={key} className="space-y-1">
                            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{key}:</Text>
                            {isUrl ? (
                              <TouchableOpacity onPress={() => setFullscreenImage(val)}>
                                <Image source={{ uri: val }} className="w-24 h-24 rounded-md border border-slate-200 dark:border-white/[0.08]" resizeMode="cover" />
                                <Text className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1">🔍 Tap to enlarge</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text className="text-[11px] font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-darkElevated px-2.5 py-1 rounded">{val as string}</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View className="p-4">
        <TouchableOpacity
          onPress={handleRegister}
          className={`py-4 rounded-xl items-center ${
            isRegistered
              ? 'bg-slate-200 dark:bg-darkElevated'
              : 'bg-[#8B5CF6] active:opacity-90 shadow-lg shadow-purple-500/20'
          }`}
        >
          <Text
            className={`font-semibold text-lg ${
              isRegistered ? 'text-slate-600 dark:text-slate-300' : 'text-white'
            }`}
          >
            {isRegistered ? 'Unregister' : 'Register Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Registration Details Form Modal */}
      <Modal visible={showFormModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-darkSurface rounded-t-3xl p-6 max-h-[85%] border-t border-slate-100 dark:border-white/[0.06]">
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06] mb-4">
              <Text className="text-lg font-extrabold text-slate-900 dark:text-white">Registration Details</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4 mb-4">
              <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                The organizer of this event requires you to fill out the following details to register.
              </Text>

              {currentEvent.customFields?.map((field) => (
                <View key={field.id} className="mb-4">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {field.name} *
                  </Text>
                  
                  {field.type === 'text' && (
                    <TextInput
                      className="bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm"
                      value={formResponses[field.id] || ''}
                      onChangeText={(text) => setFormResponses({ ...formResponses, [field.id]: text })}
                      placeholder={`Enter your ${field.name.toLowerCase()}`}
                      placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                    />
                  )}

                  {field.type === 'options' && (
                    <View className="space-y-2 mt-1">
                      {field.options?.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setFormResponses({ ...formResponses, [field.id]: opt })}
                          className={`flex-row items-center px-4 py-3 rounded-xl border ${
                            formResponses[field.id] === opt
                              ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/40'
                              : 'bg-slate-50 dark:bg-darkElevated border-slate-200 dark:border-white/[0.08]'
                          }`}
                        >
                          <Ionicons 
                            name={formResponses[field.id] === opt ? 'radio-button-on' : 'radio-button-off'} 
                            size={18} 
                            color={formResponses[field.id] === opt ? '#8B5CF6' : '#94A3B8'} 
                          />
                          <Text className="text-slate-800 dark:text-white text-sm ml-2.5 font-medium">{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {field.type === 'checkbox' && (
                    <View className="space-y-2 mt-1">
                      {field.options?.map((opt) => {
                        const isChecked = (checkedOptions[field.id] || []).includes(opt);
                        return (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => handleToggleCheckbox(field.id, opt)}
                            className={`flex-row items-center px-4 py-3 rounded-xl border ${
                              isChecked
                                ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/40'
                                : 'bg-slate-50 dark:bg-darkElevated border-slate-200 dark:border-white/[0.08]'
                            }`}
                          >
                            <Ionicons 
                              name={isChecked ? 'checkbox' : 'square-outline'} 
                              size={18} 
                              color={isChecked ? '#8B5CF6' : '#94A3B8'} 
                            />
                            <Text className="text-slate-800 dark:text-white text-sm ml-2.5 font-medium">{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {field.type === 'image' && (
                    <View className="mt-1">
                      {selectedImages[field.id] ? (
                        <View className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08] mb-2 bg-slate-50 dark:bg-darkElevated">
                          <Image source={{ uri: selectedImages[field.id] }} className="w-full h-full" resizeMode="contain" />
                          <TouchableOpacity 
                            onPress={() => setSelectedImages({ ...selectedImages, [field.id]: '' })}
                            className="absolute top-2 right-2 bg-black/60 w-8 h-8 rounded-full items-center justify-center"
                          >
                            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handlePickFieldImage(field.id)}
                          className="flex-row items-center justify-center border border-dashed border-slate-300 dark:border-white/[0.12] rounded-xl py-6 bg-slate-50 dark:bg-darkElevated"
                        >
                          <Ionicons name="cloud-upload-outline" size={24} color="#8B5CF6" />
                          <Text className="text-[#8B5CF6] dark:text-[#A78BFA] font-bold text-sm ml-2">
                            Upload Payment Screenshot
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSubmitForm}
              disabled={isSubmittingForm}
              className="bg-[#8B5CF6] py-3.5 rounded-xl items-center shadow-lg shadow-purple-500/25 active:opacity-90 mt-2"
            >
              {isSubmittingForm ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-extrabold text-base">Submit & Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Image Preview Modal */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade">
        <View className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity 
            onPress={() => setFullscreenImage(null)}
            className="absolute top-12 right-6 bg-white/20 w-10 h-10 rounded-full items-center justify-center z-10"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image 
              source={{ uri: fullscreenImage }} 
              className="w-full h-5/6" 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
