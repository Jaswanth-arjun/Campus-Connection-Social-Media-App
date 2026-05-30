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

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { events, isLoading, filter, fetchEvents, registerForEvent, unregisterForEvent, searchEvents, createEvent, createEventWithImage } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');

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
          category
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
          category
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
    <View className="flex-1 bg-themeBgLight">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View 
        className="bg-white px-5 pb-4 border-b border-purple-100/70 shadow-md shadow-purple-950/5"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Events
            </Text>
            <Text className="text-xs font-extrabold text-purple-400 mt-0.5">
              Campus activities & happenings
            </Text>
          </View>
          <View className="bg-purple-50 w-11 h-11 rounded-2xl items-center justify-center border border-purple-100">
            <Ionicons name="calendar-outline" size={21} color="#6A2FF9" />
          </View>
        </View>

        {/* Inline Search */}
        <View className="flex-row items-center bg-slate-50 border border-purple-100/60 rounded-3xl px-4 py-2.5 shadow-inner">
          <Ionicons name="search" size={18} color="#6A2FF9" />
          <TextInput
            className="flex-1 text-slate-800 font-semibold text-sm ml-2.5 py-0.5"
            placeholder="Search events..."
            placeholderTextColor="#A78BFA"
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
      <View className="bg-white border-b border-purple-100/20 py-3.5 px-4 max-h-[64px]">
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
                  ? 'bg-[#6A2FF9] shadow-md shadow-purple-900/10'
                  : 'bg-slate-50 border border-purple-100/60'
              }`}
            >
              <Text
                className={`text-sm font-extrabold ${
                  filter === category ? 'text-white' : 'text-slate-600'
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
          className="flex-1 bg-white"
        >
          {/* Modal Header */}
          <View 
            className="flex-row items-center justify-between px-5 pb-4 border-b border-slate-100"
            style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
          >
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-slate-500 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-slate-900">Post Event</Text>
            <TouchableOpacity
              onPress={handleCreateEvent}
              disabled={isPublishing}
              className="bg-[#6A2FF9] px-5 py-2.5 rounded-full"
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-extrabold text-sm">Publish</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            {/* Banner Picker */}
            <TouchableOpacity 
              onPress={handlePickBanner} 
              className="items-center mb-6 h-40 w-full bg-slate-100 rounded-2xl items-center justify-center border border-dashed border-slate-200 overflow-hidden"
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
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., CodeCraft Hackathon"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What is this event about?"
                  placeholderTextColor="#94A3B8"
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
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="e.g., 2026-06-15"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Venue / Location
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g., CSE Seminar Hall"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Organizer Name
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                    value={organizer}
                    onChangeText={setOrganizer}
                    placeholder="e.g., ACM Student Chapter"
                    placeholderTextColor="#94A3B8"
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
                        category === cat ? 'bg-[#6A2FF9]' : 'bg-slate-100 border border-slate-200/50'
                      }`}
                    >
                      <Text
                        className={`text-sm font-extrabold ${
                          category === cat ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
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

