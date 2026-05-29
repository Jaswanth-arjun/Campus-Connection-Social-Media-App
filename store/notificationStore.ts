import { create } from 'zustand';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  createNotification: (
    userId: string,
    title: string,
    body: string,
    type: 'post_like' | 'comment' | 'event' | 'announcement' | 'message',
    referenceId: string
  ) => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    try {
      set({ isLoading: true });
      const notifications = await notificationService.fetchNotifications(userId);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      set({
        notifications: get().notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error: any) {
      throw error;
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await notificationService.markAllAsRead(userId);
      set({
        notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });
    } catch (error: any) {
      throw error;
    }
  },

  createNotification: async (
    userId: string,
    title: string,
    body: string,
    type: 'post_like' | 'comment' | 'event' | 'announcement' | 'message',
    referenceId: string
  ) => {
    try {
      await notificationService.createNotification(userId, title, body, type, referenceId);
    } catch (error: any) {
      throw error;
    }
  },

  setNotifications: (notifications: Notification[]) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },
}));
