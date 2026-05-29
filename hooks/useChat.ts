import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store/authStore';

export const useChat = (roomId?: string) => {
  const { currentUser } = useAuthStore();
  const {
    rooms,
    activeRoom,
    messages,
    isLoading,
    fetchRooms,
    createRoom,
    sendMessage,
    sendMessageWithImage,
    sendMessageWithFile,
    markMessagesAsRead,
    setActiveRoom,
    setMessages,
    addMessage,
  } = useChatStore();

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = chatService.subscribeToRooms(currentUser.uid, (rooms) => {
        // Update rooms in store
      });
      fetchRooms(currentUser.uid);
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (roomId) {
      const unsubscribe = chatService.subscribeToMessages(roomId, (messages) => {
        setMessages(messages);
      });
      if (currentUser) {
        markMessagesAsRead(roomId, currentUser.uid);
      }
      return () => unsubscribe();
    }
  }, [roomId, currentUser]);

  return {
    rooms,
    activeRoom,
    messages,
    isLoading,
    fetchRooms,
    createRoom,
    sendMessage,
    sendMessageWithImage,
    sendMessageWithFile,
    setActiveRoom,
    addMessage,
  };
};
