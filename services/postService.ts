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
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { Post, Comment } from '../types';
import { storageService } from './storageService';
import { lambdaApiService, isLambdaConfigured } from './lambdaApiService';
import { Alert } from 'react-native';

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
      // ── Step 1: Content Moderation via Lambda API ──
      if (content && content.trim().length > 0 && isLambdaConfigured()) {
        try {
          const moderation = await lambdaApiService.moderateContent(content);
          if (!moderation.safe) {
            throw new Error(moderation.message);
          }
        } catch (moderationErr: any) {
          // If it's a moderation rejection, re-throw to block the post
          if (moderationErr.message && !moderationErr.message.includes('timed out') && !moderationErr.message.includes('not configured')) {
            throw moderationErr;
          }
          // Otherwise (network error, timeout), allow the post through
          console.warn('[PostService] Content moderation skipped:', moderationErr.message);
        }
      }

      // ── Step 2: Upload media to S3 ──
      let imageUrl = '';
      let fileUrl = '';

      if (imageUri) {
        try {
          imageUrl = await storageService.uploadImage(imageUri, `posts/${Date.now()}`);
        } catch (uploadErr: any) {
          Alert.alert('❌ Post Image Upload Failed', uploadErr.message || uploadErr.toString());
          // Fallback to direct URI if upload fails
          imageUrl = imageUri;
        }
      }

      if (fileUri && fileName) {
        try {
          fileUrl = await storageService.uploadFile(fileUri, 'files', fileName);
        } catch (uploadErr: any) {
          Alert.alert('❌ Post File Upload Failed', uploadErr.message || uploadErr.toString());
          fileUrl = fileUri;
        }
      }

      // ── Step 2.5: Amazon Rekognition AI — Image Moderation + Auto-Tags ──
      let rekognitionTags: string[] = [];
      if (imageUrl && imageUrl.includes('.amazonaws.com') && isLambdaConfigured()) {
        try {
          // Extract S3 bucket and key from the image URL
          const s3Url = new URL(imageUrl);
          const bucket = s3Url.hostname.split('.')[0];
          const key = s3Url.pathname.startsWith('/') ? s3Url.pathname.slice(1) : s3Url.pathname;

          const analysis = await lambdaApiService.analyzeImage(bucket, key, ['moderation', 'labels']);

          // Block the post if image is unsafe
          if (!analysis.safe) {
            // Delete the unsafe image from S3
            try { await storageService.deleteFile(imageUrl); } catch (e) {}
            throw new Error(analysis.message);
          }

          // Collect high-confidence auto-tags (>80%) from Rekognition
          if (analysis.autoTags && analysis.autoTags.length > 0) {
            rekognitionTags = analysis.autoTags
              .filter(tag => tag.confidence > 80)
              .slice(0, 5) // Max 5 AI tags
              .map(tag => tag.name.toLowerCase());
          }
        } catch (rekErr: any) {
          // If it's a moderation rejection, re-throw
          if (rekErr.message && rekErr.message.includes('inappropriate')) {
            throw rekErr;
          }
          // Otherwise (network, timeout), allow the post through
          console.warn('[PostService] Rekognition analysis skipped:', rekErr.message);
        }
      }

      // Merge user tags with AI-generated tags (deduplicate)
      const allTags = [...new Set([...tags, ...rekognitionTags])];

      // ── Step 3: Save post to Firestore ──
      const postRef = await addDoc(collection(db, 'posts'), {
        authorId,
        authorName,
        authorAvatar: authorAvatar || '',
        content: content || '',
        imageUrl: imageUrl || '',
        fileUrl: fileUrl || '',
        fileName: fileName || '',
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
        tags: allTags,
      } as Omit<Post, 'id' | 'createdAt'> & { createdAt: any });

      // ── Step 4: Log analytics event via Lambda ──
      if (isLambdaConfigured()) {
        lambdaApiService.logEvent(
          postRef.id, 
          'post_create', 
          authorId, 
          { 
            hasImage: !!imageUrl, 
            hasFile: !!fileUrl, 
            tagsCount: allTags.length, 
            contentLength: content?.length || 0 
          }
        ).catch(() => {});
      }

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
      return snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Post[];
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

      if (isLambdaConfigured()) {
        lambdaApiService.logEvent(postId, 'like', userId).catch(() => {});
      }
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
        commentsCount: increment(1),
      });

      if (isLambdaConfigured()) {
        lambdaApiService.logEvent(postId, 'comment_create', authorId, { textLength: text?.length || 0 }).catch(() => {});
      }

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
      // Querying with range where + orderBy requires a composite index.
      // We search by range and sort by createdAt in memory.
      const postsQuery = query(
        collection(db, 'posts'),
        where('content', '>=', queryText),
        where('content', '<=', queryText + '\uf8ff'),
        limit(50)
      );
      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Post[];

      return posts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20);
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
    }, (error) => {
      console.warn('[Post] Post listener error:', error);
      callback(null);
    });
    return unsubscribe;
  },

  subscribeToPosts(callback: (posts: Post[]) => void): () => void {
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Post[];
      callback(posts);
    }, (error) => {
      console.warn('[Post] Posts listener error:', error);
      callback([]);
    });
    return unsubscribe;
  },

  async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const postData = postSnap.data();
        
        // Delete image from storage if exists
        if (postData.imageUrl) {
          await storageService.deleteFile(postData.imageUrl);
        }
        
        // Delete attached file from storage if exists
        if (postData.fileUrl) {
          await storageService.deleteFile(postData.fileUrl);
        }
      }

      await deleteDoc(postRef);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete post');
    }
  },
};
