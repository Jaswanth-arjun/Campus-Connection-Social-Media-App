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
    setRooms,
  } = useChatStore();

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = chatService.subscribeToRooms(currentUser.uid, (roomsList) => {
        setRooms(roomsList);
      });
      fetchRooms(currentUser.uid);
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (roomId) {
      // 1. Subscribe to messages
      const unsubscribe = chatService.subscribeToMessages(roomId, (messagesList) => {
        setMessages(messagesList);
      });

      // 2. Fetch and set the active room details (especially to get the actual name)
      const existingRoom = rooms.find((r) => r.id === roomId);
      if (existingRoom) {
        setActiveRoom(existingRoom);
      } else {
        chatService.getRoom(roomId)
          .then((room) => {
            if (room) setActiveRoom(room);
          })
          .catch((err) => {
            console.warn('[Chat] Failed to fetch active room details:', err);
          });
      }

      if (currentUser) {
        markMessagesAsRead(roomId, currentUser.uid);
      }
      return () => unsubscribe();
    }
  }, [roomId, currentUser, rooms]);

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
