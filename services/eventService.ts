import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { Event } from '../types';
import { storageService } from './storageService';

export const eventService = {
  async createEvent(
    title: string,
    description: string,
    date: Date,
    location: string,
    organizer: string,
    imageUrl: string,
    category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other',
    customFields?: string[]
  ): Promise<string> {
    try {
      const eventRef = await addDoc(collection(db, 'events'), {
        title,
        description,
        date,
        location,
        organizer,
        imageUrl,
        category,
        registeredUsers: [],
        createdAt: serverTimestamp(),
        customFields: customFields || [],
      } as Omit<Event, 'id' | 'createdAt'> & { createdAt: any });

      return eventRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create event');
    }
  },

  async createEventWithImage(
    title: string,
    description: string,
    date: Date,
    location: string,
    organizer: string,
    imageUri: string,
    category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other',
    customFields?: string[]
  ): Promise<string> {
    try {
      const imageUrl = await storageService.uploadImage(imageUri, `events/${Date.now()}`);
      return await this.createEvent(title, description, date, location, organizer, imageUrl, category, customFields);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create event with image');
    }
  },

  async fetchEvents(category?: string): Promise<Event[]> {
    try {
      let eventsQuery;
      let shouldSortInMemory = false;

      if (category && category !== 'All') {
        // Querying with where + orderBy on different fields requires a composite index.
        // We query using only where, and sort in memory.
        eventsQuery = query(
          collection(db, 'events'),
          where('category', '==', category)
        );
        shouldSortInMemory = true;
      } else {
        const { orderBy } = require('firebase/firestore');
        eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
      }

      const snapshot = await getDocs(eventsQuery);
      let events = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          date: data.date?.toDate() || new Date(),
        };
      }) as Event[];

      if (shouldSortInMemory) {
        events.sort((a, b) => a.date.getTime() - b.date.getTime());
      }

      return events;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch events');
    }
  },

  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        return {
          id: eventDoc.id,
          ...eventDoc.data(),
          createdAt: eventDoc.data().createdAt?.toDate() || new Date(),
          date: eventDoc.data().date?.toDate() || new Date(),
        } as Event;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch event');
    }
  },

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        registeredUsers: arrayUnion(userId),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to register for event');
    }
  },

  async unregisterForEvent(eventId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        registeredUsers: arrayRemove(userId),
      });

      // Remove registration documents
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(registrationsQuery);
      const { deleteDoc } = require('firebase/firestore');
      const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(doc(db, 'eventRegistrations', docSnapshot.id)));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unregister for event');
    }
  },

  async deleteEvent(eventId: string, imageUrl?: string): Promise<void> {
    try {
      const { deleteDoc } = require('firebase/firestore');
      await deleteDoc(doc(db, 'events', eventId));
      
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId)
      );
      const regSnapshot = await getDocs(registrationsQuery);
      const batchPromises = regSnapshot.docs.map(docSnapshot => deleteDoc(doc(db, 'eventRegistrations', docSnapshot.id)));
      await Promise.all(batchPromises);

      if (imageUrl) {
        await storageService.deleteFile(imageUrl);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete event');
    }
  },

  async registerForEventWithDetails(
    eventId: string,
    userId: string,
    userName: string,
    userEmail: string,
    submittedDetails: Record<string, string>
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'eventRegistrations'), {
        eventId,
        userId,
        userName,
        userEmail,
        submittedDetails,
        registeredAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'events', eventId), {
        registeredUsers: arrayUnion(userId),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to register with details');
    }
  },

  async fetchEventRegistrations(eventId: string): Promise<any[]> {
    try {
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId)
      );
      const snapshot = await getDocs(registrationsQuery);
      return snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data() as any;
        return {
          id: docSnapshot.id,
          ...data,
          registeredAt: data.registeredAt?.toDate() || new Date(),
        };
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch registrations');
    }
  },

  async searchEvents(queryText: string): Promise<Event[]> {
    try {
      // where on title and orderBy on date requires a composite index.
      // We search on title first and sort by date in memory.
      const eventsQuery = query(
        collection(db, 'events'),
        where('title', '>=', queryText),
        where('title', '<=', queryText + '\uf8ff'),
        limit(50)
      );
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          date: data.date?.toDate() || new Date(),
        };
      }) as Event[];

      return events
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 20);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search events');
    }
  },

  subscribeToEvent(eventId: string, callback: (event: Event | null) => void): () => void {
    const unsubscribe = onSnapshot(doc(db, 'events', eventId), (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          date: doc.data().date?.toDate() || new Date(),
        } as Event);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('[Event] Event listener error:', error);
      callback(null);
    });
    return unsubscribe;
  },
};
