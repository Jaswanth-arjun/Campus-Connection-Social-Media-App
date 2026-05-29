import { create } from 'zustand';
import { Post, Comment } from '../types';
import { postService } from '../services/postService';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface PostState {
  posts: Post[];
  isLoading: boolean;
  lastPost: QueryDocumentSnapshot | null;
  hasMore: boolean;
  currentPost: Post | null;
  currentPostComments: Comment[];
  fetchPosts: (refresh?: boolean) => Promise<void>;
  createPost: (
    authorId: string,
    authorName: string,
    authorAvatar: string,
    content: string,
    imageUri?: string,
    fileUri?: string,
    fileName?: string,
    tags?: string[]
  ) => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  addComment: (
    postId: string,
    authorId: string,
    authorName: string,
    authorAvatar: string,
    text: string
  ) => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  searchPosts: (query: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  setCurrentPost: (post: Post | null) => void;
  setPosts: (posts: Post[]) => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  lastPost: null,
  hasMore: true,
  currentPost: null,
  currentPostComments: [],

  fetchPosts: async (refresh = false) => {
    try {
      set({ isLoading: true });
      const { lastPost } = get();
      
      const newPosts = await postService.fetchPosts(refresh ? undefined : (lastPost || undefined));
      
      if (refresh) {
        set({ posts: newPosts, lastPost: newPosts[newPosts.length - 1] as any, hasMore: newPosts.length >= 10 });
      } else {
        set({
          posts: [...get().posts, ...newPosts],
          lastPost: newPosts[newPosts.length - 1] as any,
          hasMore: newPosts.length >= 10,
        });
      }
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  createPost: async (
    authorId: string,
    authorName: string,
    authorAvatar: string,
    content: string,
    imageUri?: string,
    fileUri?: string,
    fileName?: string,
    tags: string[] = []
  ) => {
    try {
      set({ isLoading: true });
      await postService.createPost(authorId, authorName, authorAvatar, content, imageUri, fileUri, fileName, tags);
      await get().fetchPosts(true);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  likePost: async (postId: string, userId: string) => {
    try {
      await postService.likePost(postId, userId);
      set({
        posts: get().posts.map((post) =>
          post.id === postId ? { ...post, likes: [...post.likes, userId] } : post
        ),
      });
    } catch (error: any) {
      throw error;
    }
  },

  unlikePost: async (postId: string, userId: string) => {
    try {
      await postService.unlikePost(postId, userId);
      set({
        posts: get().posts.map((post) =>
          post.id === postId ? { ...post, likes: post.likes.filter((id) => id !== userId) } : post
        ),
      });
    } catch (error: any) {
      throw error;
    }
  },

  addComment: async (
    postId: string,
    authorId: string,
    authorName: string,
    authorAvatar: string,
    text: string
  ) => {
    try {
      await postService.addComment(postId, authorId, authorName, authorAvatar, text);
      await get().fetchComments(postId);
      set({
        posts: get().posts.map((post) =>
          post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post
        ),
      });
    } catch (error: any) {
      throw error;
    }
  },

  fetchPost: async (postId: string) => {
    try {
      set({ isLoading: true });
      const post = await postService.getPost(postId);
      set({ currentPost: post, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchComments: async (postId: string) => {
    try {
      const comments = await postService.fetchComments(postId);
      set({ currentPostComments: comments });
    } catch (error: any) {
      throw error;
    }
  },

  searchPosts: async (query: string) => {
    try {
      set({ isLoading: true });
      const posts = await postService.searchPosts(query);
      set({ posts, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      set({ isLoading: true });
      await postService.deletePost(postId);
      set({
        posts: get().posts.filter((post) => post.id !== postId),
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentPost: (post: Post | null) => {
    set({ currentPost: post });
  },

  setPosts: (posts: Post[]) => {
    set({ posts });
  },
}));
