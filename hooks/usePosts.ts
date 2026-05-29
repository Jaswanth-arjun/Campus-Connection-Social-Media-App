import { useEffect } from 'react';
import { usePostStore } from '../store/postStore';
import { postService } from '../services/postService';

export const usePosts = (postId?: string) => {
  const {
    posts,
    isLoading,
    lastPost,
    hasMore,
    currentPost,
    currentPostComments,
    fetchPosts,
    createPost,
    likePost,
    unlikePost,
    addComment,
    fetchPost,
    fetchComments,
    searchPosts,
    setCurrentPost,
  } = usePostStore();

  useEffect(() => {
    fetchPosts(true);
  }, []);

  useEffect(() => {
    if (postId) {
      const unsubscribe = postService.subscribeToPost(postId, (post) => {
        setCurrentPost(post);
      });
      return () => unsubscribe();
    }
  }, [postId]);

  return {
    posts,
    isLoading,
    hasMore,
    currentPost,
    currentPostComments,
    fetchPosts,
    createPost,
    likePost,
    unlikePost,
    addComment,
    fetchPost,
    fetchComments,
    searchPosts,
    loadMore: () => fetchPosts(false),
  };
};
