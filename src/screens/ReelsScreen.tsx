import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ReelsFeed } from '../components/ReelsFeed';
import { PearlLogo } from '../components/PearlLogo';
import { Post } from '../types/index';
import { api } from '../utils/api';
import { COLORS } from '../constants/theme';

export const ReelsScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.getReels();
      setPosts(data.items);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.nextCursor !== null;
    } catch (err) {
      console.log('[Reels] getReels failed:', err);
      setError('Couldn’t load reels. Pull to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    try {
      const { data } = await api.getReels(20, cursorRef.current ?? undefined);
      setPosts((prev) => [...prev, ...data.items]);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.nextCursor !== null;
    } catch (err) {
      console.log('[Reels] loadMore failed:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  const handleLike = useCallback(async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p))
    );
    try {
      const { data } = await api.likePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: data.likes, isLiked: data.isLiked } : p))
      );
    } catch (err) {
      console.log('[Reels] like failed:', err);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1), isLiked: false } : p))
      );
    }
  }, []);

  const handleUnlike = useCallback(async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1), isLiked: false } : p))
    );
    try {
      const { data } = await api.unlikePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: data.likes, isLiked: data.isLiked } : p))
      );
    } catch (err) {
      console.log('[Reels] unlike failed:', err);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p))
      );
    }
  }, []);

  const handleView = useCallback((postId: string, watchMs: number) => {
    api.recordView(postId, watchMs).catch(() => {});
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-slate-400 text-center mb-4">{error}</Text>
        <Pressable
          onPress={loadFirstPage}
          className="px-5 py-3 rounded-full"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-slate-400 text-center">
          No reels yet — be the first to post one from the Create tab.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ReelsFeed
        posts={posts}
        onLoadMore={handleLoadMore}
        onPostLike={handleLike}
        onPostUnlike={handleUnlike}
        onComment={() => {}}
        onView={handleView}
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
