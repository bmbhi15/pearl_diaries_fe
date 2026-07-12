import React, { useCallback, useState, useRef } from 'react';
import { View, FlatList, Pressable, Text, Image, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Post } from '../types/index';
import { VideoPlayer } from './VideoPlayer';
import { COLORS, GRADIENTS } from '../constants/theme';

interface ReelsFeedProps {
  posts: Post[];
  onLoadMore?: () => void;
  onPostLike?: (postId: string) => void;
  onPostUnlike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  /** Called with elapsed watch time (ms) when a reel scrolls out of view. */
  onView?: (postId: string, watchMs: number) => void;
}

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);

/** Right-rail action button with a springy pop on press. */
const RailButton = ({
  icon,
  label,
  tint = '#fff',
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  tint?: string;
  onPress?: () => void;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(
          withSpring(1.35, { damping: 6, stiffness: 300 }),
          withSpring(1, { damping: 10 })
        );
        onPress?.();
      }}
      className="items-center mb-6"
      hitSlop={8}
    >
      <Animated.View style={style}>
        <Ionicons name={icon} size={30} color={tint} />
      </Animated.View>
      {label !== undefined && (
        <Text className="text-white text-xs font-semibold mt-1.5">{label}</Text>
      )}
    </Pressable>
  );
};

interface ReelItemProps {
  post: Post;
  height: number;
  isVisible: boolean;
  onLike: (liked: boolean) => void;
  onComment: () => void;
}

const ReelItem = ({ post, height, isVisible, onLike, onComment }: ReelItemProps) => {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(post.isLiked);
  const bigHeart = useSharedValue(0);

  const toggleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    onLike(next);
    if (next) {
      // Instagram-style center heart burst
      bigHeart.value = withSequence(
        withSpring(1, { damping: 9, stiffness: 220 }),
        withDelay(350, withTiming(0, { duration: 250 }))
      );
    }
  }, [liked, onLike, bigHeart]);

  const bigHeartStyle = useAnimatedStyle(() => ({
    opacity: bigHeart.value,
    transform: [{ scale: 0.6 + bigHeart.value * 0.8 }],
  }));

  return (
    <View style={{ height }} className="bg-black">
      <VideoPlayer
        uri={post.content.uri}
        thumbnail={post.content.thumbnail}
        isVisible={isVisible}
        shouldPlay={isVisible}
      />

      {/* Center heart burst overlay */}
      <Animated.View
        pointerEvents="none"
        style={[bigHeartStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
        className="items-center justify-center"
      >
        <Ionicons name="heart" size={110} color="#fff" />
      </Animated.View>

      {/* Bottom gradient for legibility */}
      <LinearGradient
        colors={GRADIENTS.overlay}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.4 }}
        pointerEvents="none"
      />

      {/* Meta: user, caption, event tags */}
      <View
        className="absolute left-4 right-20"
        style={{ bottom: insets.bottom + 18 }}
      >
        <View className="flex-row items-center mb-3">
          <LinearGradient
            colors={GRADIENTS.brand}
            style={{ width: 42, height: 42, borderRadius: 21, padding: 2 }}
          >
            <Image
              source={{ uri: post.user?.avatar ?? undefined }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surface }}
            />
          </LinearGradient>
          <View className="ml-3">
            <Text className="text-white font-bold">{post.user?.name ?? 'Anonymous'}</Text>
            <Text className="text-slate-300 text-xs">{post.user?.collegeName ?? 'Pearl 2026'}</Text>
          </View>
        </View>

        {post.caption && (
          <Text className="text-white/90 text-sm leading-5 mb-2.5" numberOfLines={2}>
            {post.caption}
          </Text>
        )}

        <View className="flex-row flex-wrap">
          {post.eventTags.map((tag) => (
            <View
              key={tag}
              className="flex-row items-center rounded-full px-3 py-1.5 mr-2 mb-1"
              style={{ backgroundColor: 'rgba(124,58,237,0.45)' }}
            >
              <Ionicons name="sparkles" size={11} color="#E9D5FF" />
              <Text className="text-purple-100 text-xs font-semibold ml-1">{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Right action rail */}
      <View className="absolute right-3 items-center" style={{ bottom: insets.bottom + 24 }}>
        <RailButton
          icon={liked ? 'heart' : 'heart-outline'}
          tint={liked ? '#F43F5E' : '#fff'}
          label={formatCount(post.likes + (liked && !post.isLiked ? 1 : 0))}
          onPress={toggleLike}
        />
        <RailButton icon="chatbubble-outline" label={formatCount(post.comments)} onPress={onComment} />
        <RailButton icon="paper-plane-outline" label={formatCount(post.shares)} />
        <RailButton icon="ellipsis-vertical" />
      </View>
    </View>
  );
};

export const ReelsFeed = ({
  posts,
  onLoadMore,
  onPostLike,
  onPostUnlike,
  onComment,
  onView,
}: ReelsFeedProps) => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const watchStartRef = useRef<{ postId: string; startedAt: number } | null>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      const nextPost = first?.item as Post | undefined;

      // Reel just scrolled out of view — report how long it was watched.
      if (watchStartRef.current && watchStartRef.current.postId !== nextPost?.id) {
        const watchMs = Date.now() - watchStartRef.current.startedAt;
        onView?.(watchStartRef.current.postId, watchMs);
        watchStartRef.current = null;
      }
      if (nextPost && watchStartRef.current?.postId !== nextPost.id) {
        watchStartRef.current = { postId: nextPost.id, startedAt: Date.now() };
      }

      if (first?.index != null) setVisibleIndex(first.index);
    }
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ReelItem
        post={item}
        height={containerHeight}
        isVisible={index === visibleIndex}
        onLike={(liked) => (liked ? onPostLike?.(item.id) : onPostUnlike?.(item.id))}
        onComment={() => onComment?.(item.id)}
      />
    ),
    [containerHeight, visibleIndex, onPostLike, onPostUnlike, onComment]
  );

  return (
    <View
      className="flex-1 bg-black"
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {containerHeight > 0 && (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          snapToInterval={containerHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={onLoadMore}
          onEndReachedThreshold={2}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
          removeClippedSubviews
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={2}
        />
      )}
    </View>
  );
};
