import React, { useState, useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { ReelsFeed } from '@components/ReelsFeed';
import { Post } from '@types/index';
import { useClerk } from '@clerk/clerk-expo';

export const ReelsScreen = () => {
  const { user } = useClerk();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - Replace with API call
  useEffect(() => {
    const mockPosts: Post[] = [
      {
        id: '1',
        userId: 'user1',
        type: 'video',
        content: {
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://via.placeholder.com/400x700?text=Video+1',
          duration: 15,
          aspectRatio: 9 / 16,
        },
        eventTags: ['Inauguration', 'Tech Fest'],
        likes: 245,
        comments: 12,
        shares: 8,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user1',
          name: 'Aarav Patel',
          email: 'aarav@example.com',
          avatar: 'https://via.placeholder.com/40x40?text=User1',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '2',
        userId: 'user2',
        type: 'video',
        content: {
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
          thumbnail: 'https://via.placeholder.com/400x700?text=Video+2',
          duration: 20,
          aspectRatio: 9 / 16,
        },
        eventTags: ['Cultural Night'],
        likes: 512,
        comments: 28,
        shares: 15,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user2',
          name: 'Priya Singh',
          email: 'priya@example.com',
          avatar: 'https://via.placeholder.com/40x40?text=User2',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '3',
        userId: 'user3',
        type: 'video',
        content: {
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
          thumbnail: 'https://via.placeholder.com/400x700?text=Video+3',
          duration: 25,
          aspectRatio: 9 / 16,
        },
        eventTags: ['Sports Event', 'Pearl 2024'],
        likes: 789,
        comments: 45,
        shares: 32,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user3',
          name: 'Rahul Kumar',
          email: 'rahul@example.com',
          avatar: 'https://via.placeholder.com/40x40?text=User3',
          createdAt: new Date().toISOString(),
        },
      },
    ];

    setPosts(mockPosts);
    setIsLoading(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    // API call to load more posts
    console.log('Load more posts');
  }, []);

  const handlePostLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }, []);

  const handlePostUnlike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likes: Math.max(0, post.likes - 1) }
          : post
      )
    );
  }, []);

  const handleComment = useCallback((postId: string) => {
    // Navigate to comment screen or open modal
    console.log('Comment on post:', postId);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ReelsFeed
        posts={posts}
        currentUserId={user?.id}
        onLoadMore={handleLoadMore}
        onPostLike={handlePostLike}
        onPostUnlike={handlePostUnlike}
        onComment={handleComment}
      />
    </View>
  );
};
