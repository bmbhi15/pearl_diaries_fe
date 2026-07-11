import React, { useEffect, useRef, useState } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-video';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  isVisible: boolean;
  shouldPlay: boolean;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
  aspectRatio?: number;
}

export const VideoPlayer = ({
  uri,
  thumbnail,
  isVisible,
  shouldPlay,
  onLoadComplete,
  onError,
  aspectRatio = 9 / 16,
}: VideoPlayerProps) => {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);
  const thumbnailOpacity = useSharedValue(1);

  useEffect(() => {
    if (isVisible && shouldPlay && videoRef.current) {
      videoRef.current.playAsync();
    } else if (!isVisible && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isVisible, shouldPlay]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (!firstFrameRendered) {
        setFirstFrameRendered(true);
        setIsLoading(false);
        thumbnailOpacity.value = withTiming(0, { duration: 200 });
        onLoadComplete?.();
      }
    } else if (status.error) {
      setHasError(true);
      onError?.(status.error);
    }
  };

  const thumbnailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: thumbnailOpacity.value,
  }));

  return (
    <View
      className="w-full h-full bg-black"
      style={{ aspectRatio }}
    >
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        shouldPlay={shouldPlay && isVisible}
        isLooping
        progressUpdateIntervalMillis={500}
        useNativeControls={false}
      />

      {/* Thumbnail overlay - fades out when video first frame loads */}
      {thumbnail && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            },
            thumbnailAnimatedStyle,
          ]}
        >
          <Image
            source={{ uri: thumbnail }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
      )}

      {/* Loading indicator */}
      {isLoading && !firstFrameRendered && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/70">
          <Text className="text-white text-center">
            Failed to load video
          </Text>
        </View>
      )}
    </View>
  );
};
