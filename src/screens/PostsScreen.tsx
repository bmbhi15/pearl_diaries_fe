import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { PostsGrid } from '../components/PostsGrid';
import { ScreenHeader } from '../components/ScreenHeader';
import { Post } from '../types/index';
import { COLORS, PEARL_EVENTS } from '../constants/theme';

const now = new Date().toISOString();

const mockUser = (id: string, name: string, img: number) => ({
  id,
  name,
  email: `${id}@example.com`,
  avatar: `https://i.pravatar.cc/150?img=${img}`,
  createdAt: now,
});

const MOCK_POSTS: Post[] = [
  'Pro Show Night',
  'Battle of Bands',
  'Street Dance Battle',
  'Mr & Ms Pearl',
  'EDM Night',
  'Comedy Night',
  'Open Mic',
  'Art Exhibition',
].map((event, i) => ({
  id: `p${i + 1}`,
  userId: `u${(i % 4) + 1}`,
  user: mockUser(
    `u${(i % 4) + 1}`,
    ['Ananya Sharma', 'Rohan Verma', 'Priya Nair', 'Arjun Rao'][i % 4],
    [47, 12, 32, 60][i % 4]
  ),
  type: i % 3 === 0 ? 'video' : 'carousel',
  content: {
    uri: `https://picsum.photos/seed/pearlpost${i}/540/760`,
    thumbnail: `https://picsum.photos/seed/pearlpost${i}/540/760`,
  },
  caption: `Moments from ${event} ✨`,
  eventTags: [event],
  likes: 240 + i * 137,
  comments: 12 + i * 9,
  shares: 5 + i * 4,
  isLiked: false,
  createdAt: now,
  updatedAt: now,
}));

export const PostsScreen = () => {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter ? MOCK_POSTS.filter((p) => p.eventTags.includes(filter)) : MOCK_POSTS),
    [filter]
  );

  const filterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 12 }}
    >
      {[null, ...PEARL_EVENTS].map((event) => {
        const active = filter === event;
        return (
          <Pressable
            key={event ?? 'all'}
            onPress={() => setFilter(event)}
            className="px-4 py-2 rounded-full mr-2"
            style={{
              backgroundColor: active ? COLORS.primary : COLORS.surface,
              borderWidth: 1,
              borderColor: active ? COLORS.primary : COLORS.border,
            }}
          >
            <Text className={active ? 'text-white font-semibold' : 'text-slate-400'}>
              {event ?? 'All'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <ScreenHeader title="Explore" subtitle="Photo drops from around the fest" />
      <PostsGrid posts={filtered} header={filterChips} />
    </View>
  );
};
