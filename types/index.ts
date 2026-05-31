export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  year: string;
  bio: string;
  fcmToken: string;
  createdAt: Date;
  darkMode: boolean;
  isAdmin?: boolean;
  coverImage?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  likes: string[];
  commentsCount: number;
  createdAt: Date;
  tags: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  imageUrl: string;
  category: 'Academic' | 'Cultural' | 'Sports' | 'Workshop' | 'Other';
  registeredUsers: string[];
  createdAt: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct';
  members: string[];
  lastMessage: string;
  lastMessageTime: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  type: 'text' | 'image' | 'file';
  createdAt: Date;
  readBy: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'post_like' | 'comment' | 'event' | 'announcement' | 'message';
  referenceId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  views: string[];
  createdAt: Date;
}
