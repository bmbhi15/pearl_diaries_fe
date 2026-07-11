import React, { useCallback } from 'react';
import { View, FlatList, Image, Pressable, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Post } from '../types/index';
import { COLORS } from '../constants/theme';

interface PostsGridProps {
  posts: Post[];
  onPostPress?: (post: Post) => void;
  onLoadMore?: () => void;
  header?: React.ReactElement;
}

const GAP = 10;
const COLUMNS = 2;
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - GAP * (COLUMNS + 1)) / COLUMNS;

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);

export const PostsGrid = ({ posts, onPostPress, onLoadMore, header }: PostsGridProps) => {
  const renderPostItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <Animated.View entering={FadeInDown.delay((index % 6) * 70).duration(450)}>
        <Pressable
          onPress={() => onPostPress?.(item)}
          style={{ width: itemWidth, marginLeft: GAP, marginBottom: GAP }}
        >
          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: COLORS.surface, height: itemWidth * 1.35 }}
          >
            <Image
              source={{ uri: item.content.thumbnail || item.content.uri }}
              style={{ width: '100%', height: '100%' }}
            />

            {/* Type badge */}
            <View
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              <Ionicons
                name={item.type === 'video' ? 'play' : 'copy-outline'}
                size={14}
                color="#fff"
              />
            </View>

            {/* Bottom overlay: author + likes */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }}
              pointerEvents="none"
            />
            <View className="absolute bottom-2.5 left-2.5 right-2.5 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                {item.user?.avatar && (
                  <Image
                    source={{ uri: item.user.avatar }}
                    style={{ width: 20, height: 20, borderRadius: 10 }}
                  />
                )}
                <Text className="text-white text-xs font-semibold ml-1.5" numberOfLines={1}>
                  {item.user?.name}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="heart" size={12} color="#F43F5E" />
                <Text className="text-white text-xs font-semibold ml-1">
                  {formatCount(item.likes)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    ),
    [onPostPress]
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPostItem}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingTop: GAP, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      removeClippedSubviews
      maxToRenderPerBatch={8}
    />
  );
};
