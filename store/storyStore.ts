import { create } from 'zustand';
import { Story } from '../types';
import { storyService } from '../services/storyService';

interface StoryState {
  stories: Story[];
  isLoading: boolean;
  unsubscribeStories: (() => void) | null;
  subscribeToStories: () => void;
  unsubscribe: () => void;
  createStory: (
    userId: string,
    userName: string,
    userAvatar: string,
    imageUri: string,
    filter?: string
  ) => Promise<string>;
  viewStory: (storyId: string, userId: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  isLoading: false,
  unsubscribeStories: null,

  subscribeToStories: () => {
    // Unsubscribe if active to prevent multiple listeners
    if (get().unsubscribeStories) {
      get().unsubscribeStories!();
    }

    set({ isLoading: true });
    const unsub = storyService.subscribeToStories((stories) => {
      set({ stories, isLoading: false });
    });

    set({ unsubscribeStories: unsub });
  },

  unsubscribe: () => {
    if (get().unsubscribeStories) {
      get().unsubscribeStories!();
      set({ unsubscribeStories: null });
    }
  },

  createStory: async (
    userId: string,
    userName: string,
    userAvatar: string,
    imageUri: string,
    filter?: string
  ) => {
    try {
      set({ isLoading: true });
      const id = await storyService.createStory(userId, userName, userAvatar, imageUri, filter);
      set({ isLoading: false });
      return id;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  viewStory: async (storyId: string, userId: string) => {
    try {
      await storyService.viewStory(storyId, userId);
      // Optimistic update
      set({
        stories: get().stories.map((story) =>
          story.id === storyId && !story.views.includes(userId)
            ? { ...story, views: [...story.views, userId] }
            : story
        ),
      });
    } catch (error) {
      console.warn('Failed to register story view:', error);
    }
  },
}));
