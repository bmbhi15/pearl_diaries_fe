import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { ScreenHeader } from '../components/ScreenHeader';
import { GradientButton } from '../components/GradientButton';
import { COLORS, PEARL_EVENTS } from '../constants/theme';
import { uploadPost, PickedMedia, UploadHandle } from '../services/uploadService';

type MediaKind = 'reel' | 'carousel';
const MAX_CAROUSEL = 10;

const toPicked = (a: ImagePicker.ImagePickerAsset): PickedMedia => ({
  uri: a.uri,
  type: a.type === 'video' ? 'video' : 'image',
  mimeType: a.mimeType ?? undefined,
  fileName: a.fileName ?? undefined,
  fileSize: a.fileSize ?? undefined,
  durationMs: a.duration ?? undefined,
  width: a.width,
  height: a.height,
});

const formatDuration = (ms?: number) => {
  if (!ms) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Muted, looping inline preview of the picked reel video. */
const VideoPreview = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export const CreatePostScreen = () => {
  const [kind, setKind] = useState<MediaKind>('reel');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const uploadRef = useRef<UploadHandle | null>(null);

  const switchKind = (next: MediaKind) => {
    if (uploading) return;
    setKind(next);
    setMedia([]);
    setPickError(null);
  };

  const ensurePermission = async (): Promise<boolean> => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') return true;
    setPickError(
      canAskAgain
        ? 'We need gallery access to pick media.'
        : 'Gallery access is blocked — enable Photos permission in system settings.'
    );
    return false;
  };

  /** Reel: pick a single video from the gallery. */
  const pickVideo = async () => {
    setPickError(null);
    if (!(await ensurePermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      videoMaxDuration: 60,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setMedia([toPicked(result.assets[0])]);
    }
  };

  /** Carousel: pick up to 10 photos, appending to what's already picked. */
  const pickImages = async () => {
    setPickError(null);
    if (!(await ensurePermission())) return;
    const remaining = MAX_CAROUSEL - media.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setMedia((prev) => {
        const seen = new Set(prev.map((m) => m.uri));
        const fresh = result.assets.map(toPicked).filter((m) => !seen.has(m.uri));
        return [...prev, ...fresh].slice(0, MAX_CAROUSEL);
      });
    }
  };

  const removeImage = (uri: string) => setMedia((prev) => prev.filter((m) => m.uri !== uri));

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const reset = () => {
    setMedia([]);
    setCaption('');
    setTags([]);
    setProgress(0);
  };

  const submit = useCallback(() => {
    setUploading(true);
    setProgress(0);
    const handle = uploadPost(media, { kind, caption, eventTags: tags }, setProgress);
    uploadRef.current = handle;
    handle.promise
      .then(() => {
        setUploading(false);
        setDone(true);
        setTimeout(() => {
          setDone(false);
          reset();
        }, 1800);
      })
      .catch(() => {
        // Cancelled or failed — keep the user's draft intact
        setUploading(false);
        setProgress(0);
      });
  }, [media, kind, caption, tags]);

  const cancelUpload = () => uploadRef.current?.cancel();

  const canPost = media.length > 0 && tags.length > 0 && !uploading;
  const video = kind === 'reel' ? media[0] : undefined;

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <ScreenHeader title="Create" subtitle="Share your festival moment" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Media kind toggle */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-row rounded-2xl p-1 mt-5"
          style={{ backgroundColor: COLORS.surface }}
        >
          {(
            [
              { key: 'reel', label: 'Reel', icon: 'videocam-outline' },
              { key: 'carousel', label: 'Carousel', icon: 'images-outline' },
            ] as const
          ).map(({ key, label, icon }) => {
            const active = kind === key;
            return (
              <Pressable
                key={key}
                onPress={() => switchKind(key)}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{ backgroundColor: active ? COLORS.primary : 'transparent' }}
              >
                <Ionicons name={icon} size={17} color={active ? '#fff' : COLORS.textMuted} />
                <Text
                  className="ml-2 font-semibold"
                  style={{ color: active ? '#fff' : COLORS.textMuted }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* ---- Reel: video picker + inline preview ---- */}
        {kind === 'reel' && (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            {video ? (
              <View className="mt-5 rounded-3xl overflow-hidden" style={{ height: 300 }}>
                <VideoPreview key={video.uri} uri={video.uri} />
                <View
                  className="absolute bottom-3 left-3 flex-row items-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
                >
                  <Ionicons name="videocam" size={13} color="#fff" />
                  <Text className="text-white text-xs font-semibold ml-1.5">
                    {formatDuration(video.durationMs) || 'Video'}
                  </Text>
                </View>
                <Pressable
                  onPress={pickVideo}
                  disabled={uploading}
                  className="absolute top-3 right-3 flex-row items-center rounded-full px-3.5 py-2"
                  style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
                >
                  <Ionicons name="swap-horizontal" size={14} color="#fff" />
                  <Text className="text-white text-xs font-semibold ml-1.5">Change</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickVideo}
                className="mt-5 rounded-3xl items-center justify-center"
                style={{
                  height: 200,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.surface,
                }}
              >
                <Ionicons name="videocam-outline" size={40} color={COLORS.primaryLight} />
                <Text className="text-slate-300 font-semibold mt-3">
                  Pick a short video from your gallery
                </Text>
                <Text className="text-slate-500 text-xs mt-1">Up to 60 seconds</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* ---- Carousel: multi-image picker + thumbnail strip ---- */}
        {kind === 'carousel' && (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            {media.length === 0 ? (
              <Pressable
                onPress={pickImages}
                className="mt-5 rounded-3xl items-center justify-center"
                style={{
                  height: 200,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.surface,
                }}
              >
                <Ionicons name="images-outline" size={40} color={COLORS.primaryLight} />
                <Text className="text-slate-300 font-semibold mt-3">
                  Pick photos from your gallery
                </Text>
                <Text className="text-slate-500 text-xs mt-1">Up to {MAX_CAROUSEL} photos</Text>
              </Pressable>
            ) : (
              <View className="mt-5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {media.map((m, i) => (
                    <Animated.View key={m.uri} entering={ZoomIn.duration(250)} className="mr-2.5">
                      <Image
                        source={{ uri: m.uri }}
                        style={{ width: 110, height: 150, borderRadius: 16 }}
                      />
                      <View
                        className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                      >
                        <Text className="text-white text-[10px] font-bold">{i + 1}</Text>
                      </View>
                      {!uploading && (
                        <Pressable
                          onPress={() => removeImage(m.uri)}
                          hitSlop={8}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      )}
                    </Animated.View>
                  ))}
                  {media.length < MAX_CAROUSEL && !uploading && (
                    <Pressable
                      onPress={pickImages}
                      className="items-center justify-center"
                      style={{
                        width: 110,
                        height: 150,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderStyle: 'dashed',
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.surface,
                      }}
                    >
                      <Ionicons name="add" size={28} color={COLORS.primaryLight} />
                      <Text className="text-slate-500 text-xs mt-1">Add more</Text>
                    </Pressable>
                  )}
                </ScrollView>
                <Text className="text-slate-500 text-xs mt-2">
                  {media.length}/{MAX_CAROUSEL} photos · drag order coming soon
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {pickError && (
          <Animated.Text entering={FadeIn} className="text-red-400 text-sm mt-3">
            {pickError}
          </Animated.Text>
        )}

        {/* Caption */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} className="mt-5">
          <Text className="text-slate-300 font-semibold mb-2 text-sm">Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            editable={!uploading}
            placeholder="Say something about this moment…"
            placeholderTextColor="#64748B"
            multiline
            style={{
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 16,
              padding: 16,
              minHeight: 90,
              color: COLORS.text,
              fontSize: 15,
              textAlignVertical: 'top',
            }}
          />
        </Animated.View>

        {/* Event tags — required */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} className="mt-5">
          <Text className="text-slate-300 font-semibold text-sm">
            Tag the event <Text className="text-red-400">*</Text>
          </Text>
          <Text className="text-slate-500 text-xs mt-1 mb-3">
            Where was this taken? Pick at least one.
          </Text>
          <View className="flex-row flex-wrap">
            {PEARL_EVENTS.map((event) => {
              const active = tags.includes(event);
              return (
                <Pressable
                  key={event}
                  onPress={() => !uploading && toggleTag(event)}
                  className="mr-2 mb-2 px-3.5 py-2 rounded-full flex-row items-center"
                  style={{
                    backgroundColor: active ? 'rgba(124,58,237,0.25)' : COLORS.surface,
                    borderWidth: 1,
                    borderColor: active ? COLORS.primary : COLORS.border,
                  }}
                >
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color={COLORS.primaryLight}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text className={active ? 'text-purple-200 font-semibold' : 'text-slate-400'}>
                    {event}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Submit / progress / success */}
        <View className="mt-6 mb-10">
          {done ? (
            <Animated.View
              entering={FadeIn.duration(250)}
              className="flex-row items-center justify-center py-4 rounded-2xl"
              style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#34D399" />
              <Text className="text-emerald-300 font-bold ml-2">Posted to Pearl Diaries!</Text>
            </Animated.View>
          ) : uploading ? (
            <View>
              <View
                className="h-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: COLORS.surfaceLight }}
              >
                <View
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: COLORS.primary }}
                />
              </View>
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-slate-400 text-sm">
                  Uploading {kind === 'reel' ? 'video' : `${media.length} photos`}…{' '}
                  {Math.round(progress * 100)}%
                </Text>
                <Pressable onPress={cancelUpload} hitSlop={8}>
                  <Text className="text-red-400 font-semibold">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <GradientButton
              title={kind === 'reel' ? 'Post Reel' : 'Post Carousel'}
              onPress={submit}
              disabled={!canPost}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};
