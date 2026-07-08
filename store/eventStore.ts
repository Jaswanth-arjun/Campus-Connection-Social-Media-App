import { create } from 'zustand';
import { Event } from '../types';
import { eventService } from '../services/eventService';

interface EventState {
  events: Event[];
  isLoading: boolean;
  filter: string;
  currentEvent: Event | null;
  fetchEvents: (category?: string) => Promise<void>;
  registerForEvent: (eventId: string, userId: string) => Promise<void>;
  unregisterForEvent: (eventId: string, userId: string) => Promise<void>;
  createEvent: (
    title: string,
    description: string,
    date: Date,
    location: string,
    organizer: string,
    imageUrl: string,
    category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other',
    customFields?: string[]
  ) => Promise<void>;
  createEventWithImage: (
    title: string,
    description: string,
    date: Date,
    location: string,
    organizer: string,
    imageUri: string,
    category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other',
    customFields?: string[]
  ) => Promise<void>;
  deleteEvent: (eventId: string, imageUrl?: string) => Promise<void>;
  registerForEventWithDetails: (
    eventId: string,
    userId: string,
    userName: string,
    userEmail: string,
    submittedDetails: Record<string, string>
  ) => Promise<void>;
  fetchEvent: (eventId: string) => Promise<void>;
  searchEvents: (query: string) => Promise<void>;
  setFilter: (filter: string) => void;
  setCurrentEvent: (event: Event | null) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  filter: 'All',
  currentEvent: null,

  fetchEvents: async (category = 'All') => {
    try {
      set({ isLoading: true, filter: category });
      const events = await eventService.fetchEvents(category);
      set({ events, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerForEvent: async (eventId: string, userId: string) => {
    try {
      await eventService.registerForEvent(eventId, userId);
      set({
        events: get().events.map((event) =>
          event.id === eventId
            ? { ...event, registeredUsers: [...event.registeredUsers, userId] }
            : event
        ),
        currentEvent: get().currentEvent
          ? {
              ...get().currentEvent!,
              registeredUsers: [...get().currentEvent!.registeredUsers, userId],
            }
          : null,
      });
    } catch (error: any) {
      throw error;
    }
  },

  unregisterForEvent: async (eventId: string, userId: string) => {
    try {
      await eventService.unregisterForEvent(eventId, userId);
      set({
        events: get().events.map((event) =>
          event.id === eventId
            ? { ...event, registeredUsers: event.registeredUsers.filter((id) => id !== userId) }
            : event
        ),
        currentEvent: get().currentEvent
          ? {
              ...get().currentEvent!,
              registeredUsers: get().currentEvent!.registeredUsers.filter((id) => id !== userId),
            }
          : null,
      });
    } catch (error: any) {
      throw error;
    }
  },

  createEvent: async (
    title: string,
    description: string,
    date: Date,
    location: string,
    organizer: string,
    imageUrl: string,
    category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other',
    customFields?: string[]
  ) => {
    try {
      set({ isLoading: true });
      await eventService.createEvent(title, description, date, location, organizer, imageUrl, category, customFields);
      await get().fetchEvents(get().filter);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  createEventWithImage: async (
    title: string,
    description: string,
    date: Date,
    location: string,
    organizer: string,
    imageUri: string,
    category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other',
    customFields?: string[]
  ) => {
    try {
      set({ isLoading: true });
      await eventService.createEventWithImage(title, description, date, location, organizer, imageUri, category, customFields);
      await get().fetchEvents(get().filter);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (eventId: string, imageUrl?: string) => {
    try {
      set({ isLoading: true });
      await eventService.deleteEvent(eventId, imageUrl);
      set({
        events: get().events.filter((event) => event.id !== eventId),
        currentEvent: get().currentEvent?.id === eventId ? null : get().currentEvent,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerForEventWithDetails: async (
    eventId: string,
    userId: string,
    userName: string,
    userEmail: string,
    submittedDetails: Record<string, string>
  ) => {
    try {
      await eventService.registerForEventWithDetails(eventId, userId, userName, userEmail, submittedDetails);
      set({
        events: get().events.map((event) =>
          event.id === eventId
            ? { ...event, registeredUsers: [...event.registeredUsers, userId] }
            : event
        ),
        currentEvent: get().currentEvent
          ? {
              ...get().currentEvent!,
              registeredUsers: [...get().currentEvent!.registeredUsers, userId],
            }
          : null,
      });
    } catch (error: any) {
      throw error;
    }
  },

  fetchEvent: async (eventId: string) => {
    try {
      set({ isLoading: true });
      const event = await eventService.getEvent(eventId);
      set({ currentEvent: event, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  searchEvents: async (query: string) => {
    try {
      set({ isLoading: true });
      const events = await eventService.searchEvents(query);
      set({ events, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  setFilter: (filter: string) => {
    set({ filter });
  },

  setCurrentEvent: (event: Event | null) => {
    set({ currentEvent: event });
  },
}));
