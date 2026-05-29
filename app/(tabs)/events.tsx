import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { EventCard } from '../../components/EventCard';
import { EmptyState } from '../../components/EmptyState';
import { Config } from '../../constants/config';
import Toast from 'react-native-toast-message';

export default function EventsScreen() {
  const { currentUser } = useAuth();
  const { events, isLoading, filter, fetchEvents, registerForEvent, unregisterForEvent, searchEvents } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');

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
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-4 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Events
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Campus activities & happenings
            </Text>
          </View>
          <View className="bg-primary-50 dark:bg-primary-950 w-10 h-10 rounded-xl items-center justify-center">
            <Ionicons name="calendar" size={20} color="#4F46E5" />
          </View>
        </View>

        {/* Inline Search */}
        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-2.5">
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            className="flex-1 text-slate-900 dark:text-white text-sm ml-2.5 py-0"
            placeholder="Search events..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchEvents(filter); }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white dark:bg-slate-900 py-3 px-4 border-b border-slate-100 dark:border-slate-800"
      >
        {Config.eventCategories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => handleFilterChange(category)}
            className={`px-4 py-2 rounded-xl mr-2 ${
              filter === category
                ? 'bg-primary-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === category ? 'text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading && events.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-slate-400 mt-3 text-sm">Loading events...</Text>
          </View>
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
          className="absolute bottom-20 right-4 bg-primary-600 w-14 h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
