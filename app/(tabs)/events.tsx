import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { EventCard } from '../../components/EventCard';
import { EmptyState } from '../../components/EmptyState';
import { Config } from '../../constants/config';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useTheme } from '../../hooks/useTheme';
import { CustomField } from '../../types';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { events, isLoading, filter, fetchEvents, registerForEvent, unregisterForEvent, searchEvents, createEvent, createEventWithImage } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark } = useTheme();

  // Event Creation Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(''); // e.g. "2026-06-15"
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState<'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other'>('Academic');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'options' | 'checkbox' | 'image'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const handlePickBanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.25,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !description.trim() || !dateStr.trim() || !location.trim() || !organizer.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields',
        text2: 'Please fill in all details for the event',
      });
      return;
    }

    try {
      setIsPublishing(true);
      let eventDate = new Date();
      if (dateStr) {
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) {
          eventDate = new Date(parsed);
        }
      }

      if (imageUri) {
        await createEventWithImage(
          title,
          description,
          eventDate,
          location,
          organizer,
          imageUri,
          category,
          customFields
        );
      } else {
        // Fallback banner URLs matching category
        const defaultImages = {
          Academic: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
          Cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
          Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
          Workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
          Other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        };
        await createEvent(
          title,
          description,
          eventDate,
          location,
          organizer,
          defaultImages[category],
          category,
          customFields
        );
      }

      Toast.show({
        type: 'success',
        text1: 'Published!',
        text2: 'Event is now visible to all students 🎉',
      });

      setShowCreateModal(false);
      // Clear form fields
      setTitle('');
      setDescription('');
      setDateStr('');
      setLocation('');
      setOrganizer('');
      setCategory('Academic');
      setImageUri(null);
      setCustomFields([]);
      setNewFieldName('');
      setNewFieldType('text');
      setNewFieldOptions([]);
      setNewOption('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Publish Failed',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    fetchEvents('All');
  }, []);

  const handleFilterChange = (category: string) => {
    fetchEvents(category);
  };

  const handleRegister = async (eventId: string) => {
    if (!currentUser) return;
    try {
      await registerForEvent(eventId, currentUser.uid);
      Toast.show({ type: 'success', text1: 'Registered!', text2: 'You\'re signed up for this event 🎉' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to register' });
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!currentUser) return;
    try {
      await unregisterForEvent(eventId, currentUser.uid);
      Toast.show({ type: 'success', text1: 'Unregistered', text2: 'You\'ve left the event' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to unregister' });
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchEvents(searchQuery);
    } else {
      await fetchEvents(filter);
    }
  };

  return (
    <View className="flex-1 bg-themeBgLight dark:bg-darkBg">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        className="bg-white dark:bg-darkSurface px-5 pb-4 border-b border-purple-100/70 dark:border-white/[0.06] shadow-md shadow-purple-950/5 dark:shadow-none"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Events
            </Text>
            <Text className="text-xs font-extrabold text-purple-400 mt-0.5">
              Campus activities & happenings
            </Text>
          </View>
          <View className="bg-purple-50 dark:bg-purple-500/10 w-11 h-11 rounded-2xl items-center justify-center border border-purple-100 dark:border-white/[0.08]">
            <Ionicons name="calendar-outline" size={21} color={isDark ? '#8B5CF6' : '#6A2FF9'} />
          </View>
        </View>

        {/* Inline Search */}
        <View className="flex-row items-center bg-slate-50 dark:bg-darkElevated border border-purple-100/60 dark:border-white/[0.08] rounded-3xl px-4 py-2.5 shadow-inner">
          <Ionicons name="search" size={18} color={isDark ? '#8B5CF6' : '#6A2FF9'} />
          <TextInput
            className="flex-1 text-slate-800 dark:text-white font-semibold text-sm ml-2.5 py-0.5"
            placeholder="Search events..."
            placeholderTextColor={isDark ? '#A1A1AA' : '#A78BFA'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchEvents(filter); }}>
              <Ionicons name="close-circle" size={18} color="#A78BFA" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips Scroll Wrapper */}
      <View className="bg-white dark:bg-darkSurface border-b border-purple-100/20 dark:border-white/[0.06] py-3.5 px-4 max-h-[64px]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {Config.eventCategories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => handleFilterChange(category)}
              className={`px-4.5 py-2 rounded-2xl mr-2 ${
                filter === category
                  ? 'bg-[#6A2FF9]/10 border border-[#6A2FF9]/20'
                  : 'bg-slate-50 dark:bg-darkElevated border border-purple-100/60 dark:border-white/[0.08]'
              }`}
            >
              <Text
                className={`text-sm font-extrabold ${
                  filter === category ? 'text-[#6A2FF9] dark:text-[#A78BFA]' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading && events.length === 0 ? (
          <SkeletonLoader type="event" count={3} />
        ) : events.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Events"
            message="No events found. Check back later for upcoming campus activities!"
          />
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={currentUser?.uid}
              onRegister={() => {
                const isRegistered = currentUser && event.registeredUsers.includes(currentUser.uid);
                if (isRegistered) {
                  handleUnregister(event.id);
                } else {
                  handleRegister(event.id);
                }
              }}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      {currentUser?.isAdmin && (
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="absolute bottom-20 right-4 bg-[#6A2FF9] w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-purple-950/20 active:opacity-90"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-darkBg"
        >
          {/* Modal Header */}
          <View 
            className="flex-row items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-white/[0.06] bg-white dark:bg-darkSurface"
            style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
          >
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-slate-500 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-slate-900 dark:text-white">Post Event</Text>
            <TouchableOpacity
              onPress={handleCreateEvent}
              disabled={isPublishing}
              className="bg-[#6A2FF9]/10 px-5 py-2.5 rounded-full border border-[#6A2FF9]/20"
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#6A2FF9" />
              ) : (
                <Text className="text-[#6A2FF9] font-black text-sm">Publish</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            {/* Banner Picker */}
            <TouchableOpacity 
              onPress={handlePickBanner} 
              className="items-center mb-6 h-40 w-full bg-slate-100 dark:bg-darkElevated rounded-2xl items-center justify-center border border-dashed border-slate-200 dark:border-white/[0.08] overflow-hidden"
              style={{ minHeight: 160 }}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <Ionicons name="image-outline" size={32} color="#94A3B8" />
                  <Text className="text-slate-500 font-semibold text-xs mt-1.5">
                    Select Event Banner
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Event Title
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., CodeCraft Hackathon"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                />
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What is this event about?"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Date (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    className="bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="e.g., 2026-06-15"
                    placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Venue / Location
                  </Text>
                  <TextInput
                    className="bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g., CSE Seminar Hall"
                    placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />
                </View>
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Organizer Name
                  </Text>
                  <TextInput
                    className="bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white text-base"
                    value={organizer}
                    onChangeText={setOrganizer}
                    placeholder="e.g., ACM Student Chapter"
                    placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Category
                </Text>
                <View className="flex-row flex-wrap">
                  {(['Academic', 'Cultural', 'Sports', 'Workshop', 'Other'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`px-4.5 py-2.5 rounded-2xl mr-2 mb-2 ${
                        category === cat ? 'bg-[#6A2FF9]/10 border border-[#6A2FF9]/20' : 'bg-slate-100 dark:bg-darkElevated border border-slate-200/50 dark:border-white/[0.08]'
                      }`}
                    >
                      <Text
                        className={`text-sm font-extrabold ${
                          category === cat ? 'text-[#6A2FF9] dark:text-[#A78BFA]' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Questionnaire Fields Builder */}
              <View className="border-t border-slate-100 dark:border-white/[0.06] pt-5 mt-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Registration Form Fields (Google Form style)
                </Text>
                <Text className="text-slate-500 text-[11px] mb-3 leading-relaxed">
                  Define custom fields for student registration (e.g. Roll No, Department options, Payment Screenshot upload).
                </Text>

                {/* List of currently added fields */}
                {customFields.map((field, idx) => (
                  <View key={field.id} className="bg-slate-50 dark:bg-darkElevated p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] mb-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-2">
                        <Ionicons 
                          name={
                            field.type === 'text' ? 'document-text-outline' :
                            field.type === 'options' ? 'radio-button-on-outline' :
                            field.type === 'checkbox' ? 'checkbox-outline' : 'image-outline'
                          } 
                          size={18} 
                          color="#8B5CF6" 
                        />
                        <Text className="text-slate-800 dark:text-white font-bold ml-1.5">{field.name}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setCustomFields(customFields.filter((_, i) => i !== idx))}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row items-center mt-1">
                      <Text className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200/50 dark:bg-white/[0.04] px-2 py-0.5 rounded">
                        Type: {field.type}
                      </Text>
                    </View>

                    {/* Options list preview */}
                    {field.options && field.options.length > 0 && (
                      <View className="flex-row flex-wrap mt-2 space-x-1">
                        {field.options.map((opt, oIdx) => (
                          <View key={oIdx} className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 px-2 py-0.5 rounded-md mr-1 mb-1">
                            <Text className="text-[10px] text-[#8B5CF6] dark:text-[#A78BFA] font-medium">{opt}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {/* Form to add a new custom field */}
                <View className="bg-slate-50/50 dark:bg-darkElevated/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] mt-2">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                    + Add Questionnaire Field
                  </Text>
                  
                  {/* Field Name Input */}
                  <TextInput
                    className="bg-white dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm mb-3"
                    value={newFieldName}
                    onChangeText={setNewFieldName}
                    placeholder="e.g. Roll Number / Upload Payment Proof"
                    placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />

                  {/* Field Type Selector */}
                  <Text className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Field Input Type</Text>
                  <View className="flex-row flex-wrap mb-3">
                    {([
                      { key: 'text', label: 'Text Field', icon: 'document-text-outline' },
                      { key: 'options', label: 'Radio Choices', icon: 'radio-button-on-outline' },
                      { key: 'checkbox', label: 'Checklist', icon: 'checkbox-outline' },
                      { key: 'image', label: 'Screenshot Upload', icon: 'image-outline' }
                    ] as const).map((typeObj) => (
                      <TouchableOpacity
                        key={typeObj.key}
                        onPress={() => {
                          setNewFieldType(typeObj.key);
                          setNewFieldOptions([]);
                          setNewOption('');
                        }}
                        className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 border ${
                          newFieldType === typeObj.key
                            ? 'bg-[#6A2FF9]/10 border-[#6A2FF9]/30'
                            : 'bg-white dark:bg-darkElevated border-slate-200 dark:border-white/[0.06]'
                        }`}
                      >
                        <Ionicons name={typeObj.icon} size={15} color={newFieldType === typeObj.key ? '#6A2FF9' : '#6B7280'} />
                        <Text
                          className={`text-xs font-bold ml-1.5 ${
                            newFieldType === typeObj.key ? 'text-[#6A2FF9] dark:text-[#A78BFA]' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {typeObj.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Options Input (Only visible for choices/checklist) */}
                  {(newFieldType === 'options' || newFieldType === 'checkbox') && (
                    <View className="bg-white dark:bg-darkElevated p-3 rounded-xl border border-slate-200/60 dark:border-white/[0.04] mb-3">
                      <Text className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Add Choice Items</Text>
                      
                      <View className="flex-row items-center space-x-2 mb-2">
                        <TextInput
                          className="flex-1 bg-slate-50 dark:bg-darkElevated border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs"
                          value={newOption}
                          onChangeText={setNewOption}
                          placeholder="e.g. Yes / MCA / ECE"
                          placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            if (newOption.trim()) {
                              if (!newFieldOptions.includes(newOption.trim())) {
                                setNewFieldOptions([...newFieldOptions, newOption.trim()]);
                              }
                              setNewOption('');
                            }
                          }}
                          className="bg-[#6A2FF9] px-3.5 py-2 rounded-xl"
                        >
                          <Text className="text-white font-bold text-xs">+ Add</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Display added options */}
                      <View className="flex-row flex-wrap mt-1">
                        {newFieldOptions.map((opt, oIdx) => (
                          <View key={oIdx} className="flex-row items-center bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-full mr-1.5 mb-1.5 border border-slate-200/50 dark:border-white/[0.06]">
                            <Text className="text-xs text-slate-700 dark:text-slate-300 font-medium mr-1.5">{opt}</Text>
                            <TouchableOpacity onPress={() => setNewFieldOptions(newFieldOptions.filter((_, i) => i !== oIdx))}>
                              <Ionicons name="close-circle" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        {newFieldOptions.length === 0 && (
                          <Text className="text-[11px] text-slate-400 italic">No options added yet.</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Add Field Button */}
                  <TouchableOpacity
                    onPress={() => {
                      if (!newFieldName.trim()) {
                        Toast.show({ type: 'error', text1: 'Name Required', text2: 'Please enter a field name or question' });
                        return;
                      }
                      if ((newFieldType === 'options' || newFieldType === 'checkbox') && newFieldOptions.length === 0) {
                        Toast.show({ type: 'error', text1: 'Options Required', text2: 'Please add at least one choice option' });
                        return;
                      }
                      
                      const addedField: CustomField = {
                        id: Math.random().toString(36).substring(7),
                        name: newFieldName.trim(),
                        type: newFieldType,
                        options: (newFieldType === 'options' || newFieldType === 'checkbox') ? newFieldOptions : undefined
                      };

                      setCustomFields([...customFields, addedField]);
                      
                      // Clear builder state
                      setNewFieldName('');
                      setNewFieldType('text');
                      setNewFieldOptions([]);
                      setNewOption('');
                    }}
                    className="bg-purple-100 dark:bg-purple-500/10 py-2.5 rounded-xl border border-purple-200 dark:border-purple-500/20 items-center mt-1"
                  >
                    <Text className="text-[#6A2FF9] dark:text-[#A78BFA] font-bold text-xs">+ Add Question to Form</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View className="h-10" />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

