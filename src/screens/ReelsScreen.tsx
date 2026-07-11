import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ReelsFeed } from '../components/ReelsFeed';
import { PearlLogo } from '../components/PearlLogo';
import { Post } from '../types/index';

const now = new Date().toISOString();

const mockUser = (id: string, name: string, college: string, img: number) => ({
  id,
  name,
  email: `${id}@example.com`,
  avatar: `https://i.pravatar.cc/150?img=${img}`,
  collegeName: college,
  createdAt: now,
});

const MOCK_REELS: Post[] = [
  {
    id: 'r1',
    userId: 'u1',
    user: mockUser('u1', 'Ananya Sharma', 'BITS Hyderabad', 47),
    type: 'video',
    content: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://picsum.photos/seed/pearl1/540/960',
      duration: 15,
    },
    caption: 'The crowd went WILD at Pro Show tonight 🔥✨ #Pearl2026',
    eventTags: ['Pro Show Night'],
    likes: 2450,
    comments: 128,
    shares: 86,
    isLiked: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'r2',
    userId: 'u2',
    user: mockUser('u2', 'Rohan Verma', 'IIT Hyderabad', 12),
    type: 'video',
    content: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://picsum.photos/seed/pearl2/540/960',
      duration: 20,
    },
    caption: 'Street battle finals — that last move though 💀',
    eventTags: ['Street Dance Battle'],
    likes: 5120,
    comments: 284,
    shares: 152,
    isLiked: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'r3',
    userId: 'u3',
    user: mockUser('u3', 'Priya Nair', 'BITS Hyderabad', 32),
    type: 'video',
    content: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://picsum.photos/seed/pearl3/540/960',
      duration: 25,
    },
    caption: 'Battle of Bands sound check — tonight is going to be legendary 🎸',
    eventTags: ['Battle of Bands', 'EDM Night'],
    likes: 7890,
    comments: 445,
    shares: 320,
    isLiked: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const ReelsScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>(MOCK_REELS);

  const handleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p))
    );
  }, []);

  const handleUnlike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1), isLiked: false } : p
      )
    );
  }, []);

  return (
    <View className="flex-1 bg-black">
      <ReelsFeed
        posts={posts}
        onPostLike={handleLike}
        onPostUnlike={handleUnlike}
        onComment={() => {}}
      />

      {/* Floating brand header over the feed */}
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 76 }}
        pointerEvents="none"
      />
      <Animated.View
        entering={FadeInDown.duration(600)}
        className="absolute left-5 flex-row items-center"
        style={{ top: insets.top + 12 }}
        pointerEvents="none"
      >
        <PearlLogo size={30} />
        <Text className="text-white text-lg font-extrabold ml-2.5 tracking-tight">Reels</Text>
      </Animated.View>
    </View>
  );
};
