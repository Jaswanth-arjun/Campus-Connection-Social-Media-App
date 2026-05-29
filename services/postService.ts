import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Post, Comment } from '../types';
import { storageService } from './storageService';

export const postService = {
  async createPost(
    authorId: string,
    authorName: string,
    authorAvatar: string,
    content: string,
    imageUri?: string,
    fileUri?: string,
    fileName?: string,
    tags: string[] = []
  ): Promise<string> {
    try {
      let imageUrl = '';
      let fileUrl = '';

      if (imageUri) {
        imageUrl = await storageService.uploadImage(imageUri, `posts/${Date.now()}`);
      }

      if (fileUri && fileName) {
        fileUrl = await storageService.uploadFile(fileUri, 'files', fileName);
      }

      const postRef = await addDoc(collection(db, 'posts'), {
        authorId,
        authorName,
        authorAvatar,
        content,
        imageUrl,
        fileUrl,
        fileName,
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
        tags,
      } as Omit<Post, 'id' | 'createdAt'> & { createdAt: any });

      return postRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create post');
    }
  },

  async fetchPosts(lastPost?: QueryDocumentSnapshot, pageSize = 10): Promise<Post[]> {
    try {
      let postsQuery;
      if (lastPost) {
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastPost),
          limit(pageSize)
        );
      } else {
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(postsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Post[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch posts');
    }
  },

  async getPost(postId: string): Promise<Post | null> {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        return {
          id: postDoc.id,
          ...postDoc.data(),
          createdAt: postDoc.data().createdAt?.toDate() || new Date(),
        } as Post;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch post');
    }
  },

  async likePost(postId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: arrayUnion(userId),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to like post');
    }
  },

  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: arrayRemove(userId),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unlike post');
    }
  },

  async addComment(
    postId: string,
    authorId: string,
    authorName: string,
    authorAvatar: string,
    text: string
  ): Promise<string> {
    try {
      const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorId,
        authorName,
        authorAvatar,
        text,
        createdAt: serverTimestamp(),
      } as Omit<Comment, 'id' | 'createdAt'> & { createdAt: any });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: arrayUnion(1),
      });

      return commentRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add comment');
    }
  },

  async fetchComments(postId: string): Promise<Comment[]> {
    try {
      const commentsQuery = query(
        collection(db, 'posts', postId, 'comments'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(commentsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Comment[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch comments');
    }
  },

  async searchPosts(queryText: string): Promise<Post[]> {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('content', '>=', queryText),
        where('content', '<=', queryText + '\uf8ff'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(postsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Post[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search posts');
    }
  },

  subscribeToPost(postId: string, callback: (post: Post | null) => void): () => void {
    const unsubscribe = onSnapshot(doc(db, 'posts', postId), (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Post);
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  },
};
