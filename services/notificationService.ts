import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { Notification } from '../types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { lambdaApiService, isLambdaConfigured } from './lambdaApiService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: 'post_like' | 'comment' | 'event' | 'announcement' | 'message',
    referenceId: string
  ): Promise<string> {
    try {
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        body,
        type,
        referenceId,
        isRead: false,
        createdAt: serverTimestamp(),
      } as Omit<Notification, 'id' | 'createdAt'> & { createdAt: any });

      // Send real-time push via Amazon SNS (fire-and-forget)
      if (isLambdaConfigured()) {
        lambdaApiService.sendNotification(userId, title, body, type, { referenceId })
          .catch((err) => console.warn('[SNS] Push delivery failed:', err.message));
      }

      return notificationRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create notification');
    }
  },

  async fetchNotifications(userId: string): Promise<Notification[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(notificationsQuery);
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Notification[];

      // Sort in memory to bypass composite index requirements
      return docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(notificationsQuery);

      snapshot.docs.forEach(async (doc) => {
        await updateDoc(doc.ref, { isRead: true });
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Notification[];

      // Sort in memory to bypass composite index requirements
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      callback(notifications);
    }, (error) => {
      console.warn('[Notification] Notification listener error:', error);
      callback([]);
    });

    return unsubscribe;
  },

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  },

  async getExpoPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
      return null;
    }
  },

  /**
   * Register the device's push token with the Amazon SNS backend.
   * This enables server-side push notifications via AWS Lambda + SNS.
   * Call this once on app startup after user is authenticated.
   */
  async registerWithSNS(userId: string, email?: string): Promise<boolean> {
    try {
      // Request notification permissions
      const granted = await this.requestPermissions();
      if (!granted) {
        console.warn('[SNS] Notification permissions not granted');
        return false;
      }

      // Get the Expo push token
      const pushToken = await this.getExpoPushToken();
      if (!pushToken) {
        console.warn('[SNS] Could not get Expo push token');
        return false;
      }

      // Register token with Lambda/SNS backend
      if (isLambdaConfigured()) {
        const result = await lambdaApiService.registerPushToken(
          userId,
          pushToken,
          Platform.OS,
          email
        );
        console.log('[SNS] Push token registered:', result.message);
        return result.success;
      }

      return false;
    } catch (error: any) {
      console.error('[SNS] Registration failed:', error.message);
      return false;
    }
  },

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
    }
  },
};

