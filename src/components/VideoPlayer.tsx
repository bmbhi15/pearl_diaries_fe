import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import Animated, {
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
  aspectRatio,
}: VideoPlayerProps) => {
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);
  const thumbnailOpacity = useSharedValue(1);

  // expo-video v3: create a player instance for this source.
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Subscribe to status changes (idle | loading | readyToPlay | error).
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  // Play/pause driven by feed visibility — mirrors the pooled-player pattern.
  useEffect(() => {
    if (isVisible && shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, shouldPlay, player]);

  // First-frame handoff: fade the thumbnail out once the video is ready.
  useEffect(() => {
    if (status === 'readyToPlay' && !firstFrameRendered) {
      setFirstFrameRendered(true);
      thumbnailOpacity.value = withTiming(0, { duration: 200 });
      onLoadComplete?.();
    }
    if (status === 'error') {
      onError?.(error?.message ?? 'Failed to load video');
    }
  }, [status, error, firstFrameRendered, onLoadComplete, onError, thumbnailOpacity]);

  const thumbnailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: thumbnailOpacity.value,
  }));

  const isLoading = status === 'loading' || status === 'idle';
  const hasError = status === 'error';

  return (
    <View
      className="w-full h-full bg-black"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
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
          pointerEvents="none"
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
          <Text className="text-white text-center">Failed to load video</Text>
        </View>
      )}
    </View>
  );
};
