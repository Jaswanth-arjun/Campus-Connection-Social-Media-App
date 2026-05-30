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
  onSnapshot,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { ChatRoom, Message } from '../types';
import { storageService } from './storageService';

export const chatService = {
  async createRoom(
    name: string,
    type: 'group' | 'direct',
    members: string[]
  ): Promise<string> {
    try {
      const roomRef = await addDoc(collection(db, 'chatRooms'), {
        name,
        type,
        members,
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
      } as Omit<ChatRoom, 'id' | 'lastMessageTime' | 'createdAt'> & { lastMessageTime: any; createdAt: any });

      return roomRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create chat room');
    }
  },

  async fetchRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const roomsQuery = query(
        collection(db, 'chatRooms'),
        where('members', 'array-contains', userId)
      );
      const snapshot = await getDocs(roomsQuery);
      const rooms = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as ChatRoom[];

      // Sort in memory to bypass composite index requirements
      return rooms.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch chat rooms');
    }
  },

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      const roomDoc = await getDoc(doc(db, 'chatRooms', roomId));
      if (roomDoc.exists()) {
        return {
          id: roomDoc.id,
          ...roomDoc.data(),
          lastMessageTime: roomDoc.data().lastMessageTime?.toDate() || new Date(),
          createdAt: roomDoc.data().createdAt?.toDate() || new Date(),
        } as ChatRoom;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch chat room');
    }
  },

  async sendMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    text: string,
    type: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string,
    fileName?: string
  ): Promise<string> {
    try {
      const messageRef = await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
        senderId,
        senderName,
        senderAvatar,
        text,
        type,
        fileUrl,
        fileName,
        readBy: [senderId],
        createdAt: serverTimestamp(),
      } as Omit<Message, 'id' | 'createdAt'> & { createdAt: any });

      await updateDoc(doc(db, 'chatRooms', roomId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      });

      return messageRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  },

  async sendMessageWithImage(
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    imageUri: string
  ): Promise<string> {
    try {
      const fileUrl = await storageService.uploadImage(imageUri, `chat/${roomId}/${Date.now()}`);
      return await this.sendMessage(roomId, senderId, senderName, senderAvatar, '', 'image', fileUrl);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send image message');
    }
  },

  async sendMessageWithFile(
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    fileUri: string,
    fileName: string
  ): Promise<string> {
    try {
      const fileUrl = await storageService.uploadFile(fileUri, `chat/${roomId}`, fileName);
      return await this.sendMessage(roomId, senderId, senderName, senderAvatar, '', 'file', fileUrl, fileName);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send file message');
    }
  },

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      const messagesQuery = query(
        collection(db, 'chatRooms', roomId, 'messages'),
        where('readBy', 'array-contains', userId)
      );
      const snapshot = await getDocs(messagesQuery);

      await Promise.all(
        snapshot.docs.map((messageDoc) =>
          updateDoc(messageDoc.ref, {
            readBy: arrayUnion(userId),
          })
        )
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark messages as read');
    }
  },

  subscribeToMessages(roomId: string, callback: (messages: Message[]) => void): () => void {
    // Only sorting by createdAt is fine here (no where clause with orderBy)
    const { orderBy } = require('firebase/firestore');
    const messagesQuery = query(
      collection(db, 'chatRooms', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Message[];
      callback(messages);
    });

    return unsubscribe;
  },

  subscribeToRooms(userId: string, callback: (rooms: ChatRoom[]) => void): () => void {
    const roomsQuery = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const rooms = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as ChatRoom[];

      // Sort in memory to bypass composite index requirements
      rooms.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

      callback(rooms);
    });

    return unsubscribe;
  },
};
