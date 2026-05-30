import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const userCredential = await authService.login(email, password);
      const userData = await authService.getUser(userCredential.uid);

      if (userData) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        set({ currentUser: userData, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error('User profile not found');
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true });
      const userCredential = await authService.register(email, password, name);
      const userData = await authService.getUser(userCredential.uid);

      if (userData) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        set({ currentUser: userData, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error('Failed to create user profile');
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      await AsyncStorage.removeItem('user');
      set({ currentUser: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('No user logged in');

      await authService.updateUserProfile(currentUser.uid, updates);
      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ currentUser: updatedUser });
    } catch {
      throw new Error('Failed to update profile');
    }
  },

  loadUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        set({ currentUser: userData, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user, isAuthenticated: !!user, isLoading: false });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
}));
