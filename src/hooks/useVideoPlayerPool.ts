import { useRef, useCallback, useEffect } from 'react';
import { VideoPreloadState } from '@types/index';

interface PooledPlayer {
  id: string;
  isReady: boolean;
  isBusy: boolean;
  videoUri?: string;
}

export const useVideoPlayerPool = (poolSize: number = 3) => {
  const poolRef = useRef<PooledPlayer[]>([]);
  const preloadStatesRef = useRef<Map<string, VideoPreloadState>>(new Map());

  // Initialize pool
  useEffect(() => {
    poolRef.current = Array.from({ length: poolSize }).map((_, i) => ({
      id: `player-${i}`,
      isReady: false,
      isBusy: false,
    }));
  }, [poolSize]);

  // Get an available player for a video
  const acquirePlayer = useCallback((videoUri: string): PooledPlayer | null => {
    // First, try to reuse existing player with same video
    const existingPlayer = poolRef.current.find(
      (p) => p.videoUri === videoUri && !p.isBusy
    );
    if (existingPlayer) {
      existingPlayer.isBusy = true;
      return existingPlayer;
    }

    // Otherwise, get first ready player
    const readyPlayer = poolRef.current.find(
      (p) => p.isReady && !p.isBusy
    );
    if (readyPlayer) {
      readyPlayer.isBusy = true;
      readyPlayer.videoUri = videoUri;
      return readyPlayer;
    }

    // Fallback: get any non-busy player
    const availablePlayer = poolRef.current.find((p) => !p.isBusy);
    if (availablePlayer) {
      availablePlayer.isBusy = true;
      availablePlayer.videoUri = videoUri;
      return availablePlayer;
    }

    return null;
  }, []);

  // Release a player back to pool
  const releasePlayer = useCallback((playerId: string) => {
    const player = poolRef.current.find((p) => p.id === playerId);
    if (player) {
      player.isBusy = false;
    }
  }, []);

  // Mark player as ready after loading
  const markPlayerReady = useCallback((playerId: string) => {
    const player = poolRef.current.find((p) => p.id === playerId);
    if (player) {
      player.isReady = true;
    }
  }, []);

  // Update preload state for a video
  const updatePreloadState = useCallback(
    (videoUri: string, state: VideoPreloadState) => {
      preloadStatesRef.current.set(videoUri, state);
    },
    []
  );

  // Get preload state for a video
  const getPreloadState = useCallback(
    (videoUri: string): VideoPreloadState | undefined => {
      return preloadStatesRef.current.get(videoUri);
    },
    []
  );

  // Clean up when unmounting
  const cleanup = useCallback(() => {
    poolRef.current.forEach((player) => {
      player.isReady = false;
      player.isBusy = false;
      player.videoUri = undefined;
    });
    preloadStatesRef.current.clear();
  }, []);

  return {
    acquirePlayer,
    releasePlayer,
    markPlayerReady,
    updatePreloadState,
    getPreloadState,
    cleanup,
  };
};
