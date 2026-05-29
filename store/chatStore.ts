import { create } from 'zustand';
import { ChatRoom, Message } from '../types';
import { chatService } from '../services/chatService';

interface ChatState {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  fetchRooms: (userId: string) => Promise<void>;
  createRoom: (
    name: string,
    type: 'group' | 'direct',
    members: string[]
  ) => Promise<string>;
  sendMessage: (
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    text: string,
    type?: 'text' | 'image' | 'file',
    fileUrl?: string,
    fileName?: string
  ) => Promise<void>;
  sendMessageWithImage: (
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    imageUri: string
  ) => Promise<void>;
  sendMessageWithFile: (
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    fileUri: string,
    fileName: string
  ) => Promise<void>;
  markMessagesAsRead: (roomId: string, userId: string) => Promise<void>;
  setActiveRoom: (room: ChatRoom | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: [],
  isLoading: false,

  fetchRooms: async (userId: string) => {
    try {
      set({ isLoading: true });
      const rooms = await chatService.fetchRooms(userId);
      set({ rooms, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  createRoom: async (name: string, type: 'group' | 'direct', members: string[]) => {
    try {
      const roomId = await chatService.createRoom(name, type, members);
      await get().fetchRooms(members[0]);
      return roomId;
    } catch (error: any) {
      throw error;
    }
  },

  sendMessage: async (
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    text: string,
    type: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    try {
      await chatService.sendMessage(roomId, senderId, senderName, senderAvatar, text, type, fileUrl, fileName);
    } catch (error: any) {
      throw error;
    }
  },

  sendMessageWithImage: async (
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    imageUri: string
  ) => {
    try {
      await chatService.sendMessageWithImage(roomId, senderId, senderName, senderAvatar, imageUri);
    } catch (error: any) {
      throw error;
    }
  },

  sendMessageWithFile: async (
    roomId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    fileUri: string,
    fileName: string
  ) => {
    try {
      await chatService.sendMessageWithFile(roomId, senderId, senderName, senderAvatar, fileUri, fileName);
    } catch (error: any) {
      throw error;
    }
  },

  markMessagesAsRead: async (roomId: string, userId: string) => {
    try {
      await chatService.markMessagesAsRead(roomId, userId);
    } catch (error: any) {
      throw error;
    }
  },

  setActiveRoom: (room: ChatRoom | null) => {
    set({ activeRoom: room, messages: [] });
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },

  addMessage: (message: Message) => {
    set({ messages: [...get().messages, message] });
  },
}));
