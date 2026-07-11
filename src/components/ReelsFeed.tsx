import React, { useCallback, useState, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  Pressable,
  Text,
  Image,
} from 'react-native';
import { Post, User } from '@types/index';
import { VideoPlayer } from './VideoPlayer';
import { useVideoPlayerPool } from '@hooks/useVideoPlayerPool';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

interface ReelsFeedProps {
  posts: Post[];
  currentUserId?: string;
  onLoadMore?: () => void;
  onPostLike?: (postId: string) => void;
  onPostUnlike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

const { height: screenHeight } = Dimensions.get('window');

interface ReelItemProps {
  post: Post;
  isVisible: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onLoadComplete?: () => void;
}

const ReelItem = ({
  post,
  isVisible,
  onLike,
  onComment,
  onLoadComplete,
}: ReelItemProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);

  const handleLikePress = useCallback(() => {
    setIsLiked(!isLiked);
    onLike?.();
  }, [isLiked, onLike]);

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutUp}
      style={{ height: screenHeight }}
      className="bg-black relative"
    >
      {/* Video Player */}
      <VideoPlayer
        uri={post.content.uri}
        thumbnail={post.content.thumbnail}
        isVisible={isVisible}
        shouldPlay={isVisible}
        onLoadComplete={onLoadComplete}
        aspectRatio={post.content.aspectRatio || 9 / 16}
      />

      {/* User Info & Overlay */}
      <View className="absolute bottom-0 left-0 right-0 p-4 pb-20">
        {/* User Info */}
        <View className="flex-row items-center mb-4">
          {post.user?.avatar && (
            <Image
              source={{ uri: post.user.avatar }}
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <View>
            <Text className="text-white font-bold">
              {post.user?.name || 'Anonymous'}
            </Text>
            {post.eventTags.length > 0 && (
              <Text className="text-gray-300 text-xs">
                at {post.eventTags.join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Caption */}
        {post.content.uri && (
          <Text className="text-white text-sm mb-4 leading-5">
            {post.content.uri}
          </Text>
        )}
      </View>

      {/* Action Buttons (Right Side) */}
      <View className="absolute right-4 bottom-20 items-center gap-6">
        {/* Like Button */}
        <Pressable
          onPress={handleLikePress}
          className="items-center"
        >
          <View className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
            <Text className={`text-2xl ${isLiked ? 'text-red-500' : 'text-white'}`}>
              ❤️
            </Text>
          </View>
          <Text className="text-white text-xs mt-1 font-semibold">
            {post.likes + (isLiked ? 1 : 0)}
          </Text>
        </Pressable>

        {/* Comment Button */}
        <Pressable
          onPress={onComment}
          className="items-center"
        >
          <View className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
            <Text className="text-2xl">💬</Text>
          </View>
          <Text className="text-white text-xs mt-1 font-semibold">
            {post.comments}
          </Text>
        </Pressable>

        {/* Share Button */}
        <Pressable className="items-center">
          <View className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
            <Text className="text-2xl">↗️</Text>
          </View>
          <Text className="text-white text-xs mt-1 font-semibold">
            {post.shares}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export const ReelsFeed = ({
  posts,
  currentUserId,
  onLoadMore,
  onPostLike,
  onPostUnlike,
  onComment,
}: ReelsFeedProps) => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { acquirePlayer, releasePlayer, markPlayerReady } = useVideoPlayerPool(3);

  // Sliding window preload: load current, next, and prev
  const preloadIndices = useMemo(() => {
    return {
      prev: Math.max(0, visibleIndex - 1),
      current: visibleIndex,
      next: Math.min(posts.length - 1, visibleIndex + 1),
    };
  }, [visibleIndex, posts.length]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        setVisibleIndex(newIndex);

        // Trigger load more when near end
        if (newIndex >= posts.length - 3) {
          onLoadMore?.();
        }
      }
    },
    [posts.length, onLoadMore]
  );

  const handlePostLike = useCallback(
    (postId: string) => {
      onPostLike?.(postId);
    },
    [onPostLike]
  );

  const handlePostComment = useCallback(
    (postId: string) => {
      onComment?.(postId);
    },
    [onComment]
  );

  const renderReel = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const isVisible = index === preloadIndices.current;

      return (
        <ReelItem
          post={item}
          isVisible={isVisible}
          onLike={() => handlePostLike(item.id)}
          onComment={() => handlePostComment(item.id)}
          onLoadComplete={() => markPlayerReady(`player-${index}`)}
        />
      );
    },
    [preloadIndices, handlePostLike, handlePostComment, markPlayerReady]
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <FlatList
      ref={flatListRef}
      data={posts}
      renderItem={renderReel}
      keyExtractor={keyExtractor}
      pagingEnabled
      snapToInterval={screenHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
      }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      updateCellsBatchingPeriod={50}
      initialNumToRender={2}
    />
  );
};
