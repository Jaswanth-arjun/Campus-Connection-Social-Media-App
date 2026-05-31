import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Story } from '../types';

export const storyService = {
  async createStory(
    userId: string,
    userName: string,
    userAvatar: string,
    imageUri: string,
    filter?: string
  ): Promise<string> {
    try {
      let imageUrl = imageUri;
      // Snaps/stories will use compressed base64 images to keep it fast and fit in Firestore 1MB limits

      const storyRef = await addDoc(collection(db, 'stories'), {
        userId,
        userName,
        userAvatar: userAvatar || '',
        imageUrl,
        views: [],
        filter: filter || 'none',
        createdAt: serverTimestamp(),
      });

      return storyRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to post snap');
    }
  },

  async viewStory(storyId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'stories', storyId), {
        views: arrayUnion(userId),
      });
    } catch (error: any) {
      console.warn('Failed to view story:', error);
    }
  },

  subscribeToStories(callback: (stories: Story[]) => void): () => void {
    // Fetch stories from the last 24 hours
    const storiesQuery = query(
      collection(db, 'stories'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const stories = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Story[];

      // Filter for last 24 hours to keep stories ephemeral
      const filteredStories = stories.filter(
        (story) => story.createdAt.getTime() >= oneDayAgo.getTime()
      );
      callback(filteredStories);
    }, (error) => {
      console.warn('[Story] Stories listener error:', error);
      callback([]);
    });

    return unsubscribe;
  },
};
