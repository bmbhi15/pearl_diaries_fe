import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { PostsGrid } from '@components/PostsGrid';
import { Post } from '@types/index';
import { useClerk } from '@clerk/clerk-expo';

export const PostsScreen = ({ navigation }: any) => {
  const { user } = useClerk();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - Replace with API call
  useEffect(() => {
    const mockPosts: Post[] = [
      {
        id: '1',
        userId: 'user1',
        type: 'carousel',
        content: {
          uri: 'https://via.placeholder.com/400x500?text=Carousel+1',
          thumbnail: 'https://via.placeholder.com/400x500?text=Carousel+1',
          items: [
            {
              uri: 'https://via.placeholder.com/400x500?text=Item+1',
              type: 'image',
            },
            {
              uri: 'https://via.placeholder.com/400x500?text=Item+2',
              type: 'image',
            },
            {
              uri: 'https://via.placeholder.com/400x500?text=Item+3',
              type: 'image',
            },
          ],
        },
        eventTags: ['Inauguration'],
        likes: 156,
        comments: 8,
        shares: 5,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user1',
          name: 'Aarav Patel',
          email: 'aarav@example.com',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '2',
        userId: 'user2',
        type: 'video',
        content: {
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://via.placeholder.com/400x500?text=Video+1',
          duration: 15,
        },
        eventTags: ['Cultural Night'],
        likes: 234,
        comments: 15,
        shares: 10,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user2',
          name: 'Priya Singh',
          email: 'priya@example.com',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '3',
        userId: 'user3',
        type: 'carousel',
        content: {
          uri: 'https://via.placeholder.com/400x500?text=Carousel+2',
          thumbnail: 'https://via.placeholder.com/400x500?text=Carousel+2',
          items: [
            {
              uri: 'https://via.placeholder.com/400x500?text=Photo+1',
              type: 'image',
            },
            {
              uri: 'https://via.placeholder.com/400x500?text=Photo+2',
              type: 'image',
            },
          ],
        },
        eventTags: ['Sports'],
        likes: 345,
        comments: 22,
        shares: 18,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user3',
          name: 'Rahul Kumar',
          email: 'rahul@example.com',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '4',
        userId: 'user1',
        type: 'video',
        content: {
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
          thumbnail: 'https://via.placeholder.com/400x500?text=Video+2',
          duration: 20,
        },
        eventTags: ['Pearl 2024'],
        likes: 567,
        comments: 31,
        shares: 25,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user1',
          name: 'Aarav Patel',
          email: 'aarav@example.com',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '5',
        userId: 'user2',
        type: 'carousel',
        content: {
          uri: 'https://via.placeholder.com/400x500?text=Carousel+3',
          thumbnail: 'https://via.placeholder.com/400x500?text=Carousel+3',
          items: [
            {
              uri: 'https://via.placeholder.com/400x500?text=Image+1',
              type: 'image',
            },
            {
              uri: 'https://via.placeholder.com/400x500?text=Image+2',
              type: 'image',
            },
            {
              uri: 'https://via.placeholder.com/400x500?text=Image+3',
              type: 'image',
            },
            {
              uri: 'https://via.placeholder.com/400x500?text=Image+4',
              type: 'image',
            },
          ],
        },
        eventTags: ['Tech Event'],
        likes: 421,
        comments: 19,
        shares: 14,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user2',
          name: 'Priya Singh',
          email: 'priya@example.com',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '6',
        userId: 'user3',
        type: 'video',
        content: {
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
          thumbnail: 'https://via.placeholder.com/400x500?text=Video+3',
          duration: 25,
        },
        eventTags: ['Music Fest'],
        likes: 678,
        comments: 42,
        shares: 35,
        isLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 'user3',
          name: 'Rahul Kumar',
          email: 'rahul@example.com',
          createdAt: new Date().toISOString(),
        },
      },
    ];

    setPosts(mockPosts);
    setIsLoading(false);
  }, []);

  const handlePostPress = useCallback(
    (post: Post) => {
      // Navigate to detailed view or open modal
      console.log('Post pressed:', post.id);
    },
    []
  );

  const handleLoadMore = useCallback(() => {
    // API call to load more posts
    console.log('Load more posts');
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-2">
      <PostsGrid
        posts={posts}
        onPostPress={handlePostPress}
        onLoadMore={handleLoadMore}
      />
    </View>
  );
};
