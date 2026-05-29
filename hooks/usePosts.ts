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
    deletePost,
    setCurrentPost,
    setPosts,
  } = usePostStore();

  useEffect(() => {
    const unsubscribe = postService.subscribeToPosts((postsList) => {
      setPosts(postsList);
    });
    return () => unsubscribe();
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
    deletePost,
    loadMore: () => fetchPosts(false),
  };
};
