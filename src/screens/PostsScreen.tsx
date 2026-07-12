import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { PostsGrid } from '../components/PostsGrid';
import { ScreenHeader } from '../components/ScreenHeader';
import { Post, Event } from '../types/index';
import { api } from '../utils/api';
import { COLORS } from '../constants/theme';

export const PostsScreen = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  // Public endpoint — events for the filter chips, independent of auth state.
  useEffect(() => {
    api
      .getEvents()
      .then(({ data }) => setEvents(data))
      .catch((err) => console.log('[Explore] getEvents failed:', err));
  }, []);

  const loadFirstPage = useCallback(async (eventTag: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.getExplore(20, undefined, eventTag ?? undefined);
      setPosts(data.items);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.nextCursor !== null;
    } catch (err) {
      console.log('[Explore] getExplore failed:', err);
      setError('Couldn’t load posts. Pull to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch from the server whenever the event filter changes.
  useEffect(() => {
    loadFirstPage(filter);
  }, [filter, loadFirstPage]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    try {
      const { data } = await api.getExplore(20, cursorRef.current ?? undefined, filter ?? undefined);
      setPosts((prev) => [...prev, ...data.items]);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.nextCursor !== null;
    } catch (err) {
      console.log('[Explore] loadMore failed:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, filter]);

  const filterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 12 }}
    >
      {[null, ...events.map((e) => e.name)].map((eventName) => {
        const active = filter === eventName;
        return (
          <Pressable
            key={eventName ?? 'all'}
            onPress={() => setFilter(eventName)}
            className="px-4 py-2 rounded-full mr-2"
            style={{
              backgroundColor: active ? COLORS.primary : COLORS.surface,
              borderWidth: 1,
              borderColor: active ? COLORS.primary : COLORS.border,
            }}
          >
            <Text className={active ? 'text-white font-semibold' : 'text-slate-400'}>
              {eventName ?? 'All'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <ScreenHeader title="Explore" subtitle="Photo drops from around the fest" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-slate-400 text-center mb-4">{error}</Text>
          <Pressable
            onPress={() => loadFirstPage(filter)}
            className="px-5 py-3 rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <PostsGrid posts={posts} header={filterChips} onLoadMore={handleLoadMore} />
      )}
    </View>
  );
};
