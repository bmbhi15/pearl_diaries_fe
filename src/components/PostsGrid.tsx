import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  Pressable,
  Text,
  Dimensions,
} from 'react-native';
import { Post } from '@types/index';
import Animated, { FadeIn } from 'react-native-reanimated';

interface PostsGridProps {
  posts: Post[];
  onPostPress?: (post: Post) => void;
  onLoadMore?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const columnCount = 3;
const itemSize = (screenWidth - 12) / columnCount;

export const PostsGrid = ({
  posts,
  onPostPress,
  onLoadMore,
}: PostsGridProps) => {
  const handlePostPress = useCallback(
    (post: Post) => {
      onPostPress?.(post);
    },
    [onPostPress]
  );

  const handleEndReached = useCallback(() => {
    onLoadMore?.();
  }, [onLoadMore]);

  const renderPostItem = useCallback(
    ({ item }: { item: Post }) => (
      <Animated.View entering={FadeIn}>
        <Pressable
          onPress={() => handlePostPress(item)}
          className="m-1"
        >
          <View className="bg-gray-200 rounded-lg overflow-hidden">
            <Image
              source={{ uri: item.content.thumbnail || item.content.uri }}
              style={{
                width: itemSize - 8,
                height: itemSize - 8,
              }}
            />
            {item.type === 'video' && (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <Text className="text-white text-2xl">▶️</Text>
              </View>
            )}
            {item.type === 'carousel' && (
              <View className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-xs font-bold">
                  {item.content.items?.length || 0}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    ),
    [handlePostPress]
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <FlatList
      data={posts}
      renderItem={renderPostItem}
      keyExtractor={keyExtractor}
      numColumns={columnCount}
      scrollEnabled
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      removeClippedSubviews={true}
      maxToRenderPerBatch={9}
      updateCellsBatchingPeriod={50}
    />
  );
};
