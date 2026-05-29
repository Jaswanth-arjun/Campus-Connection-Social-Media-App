import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { EventCard } from '../../components/EventCard';
import { EmptyState } from '../../components/EmptyState';
import { SearchBar } from '../../components/SearchBar';
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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registered for event',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to register',
      });
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!currentUser) return;

    try {
      await unregisterForEvent(eventId, currentUser.uid);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Unregistered from event',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to unregister',
      });
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events..."
          className="mb-2"
        />
        <TouchableOpacity onPress={handleSearch} className="bg-primary-600 rounded-lg py-2 items-center">
          <Text className="text-white font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white dark:bg-gray-900 py-3 px-4 border-b border-gray-200 dark:border-gray-800">
        {Config.eventCategories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => handleFilterChange(category)}
            className={`px-4 py-2 rounded-full mr-2 ${
              filter === category ? 'bg-primary-600' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <Text className={filter === category ? 'text-white font-medium' : 'text-gray-700 dark:text-gray-300'}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4 py-4">
        {isLoading && events.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : events.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Events"
            message="No events found. Check back later!"
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
      </ScrollView>

      {currentUser?.isAdmin && (
        <TouchableOpacity
          className="absolute bottom-20 right-4 bg-primary-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
