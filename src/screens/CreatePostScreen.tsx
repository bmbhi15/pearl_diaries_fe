import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { ScreenHeader } from '../components/ScreenHeader';
import { GradientButton } from '../components/GradientButton';
import { COLORS, PEARL_EVENTS } from '../constants/theme';

type MediaKind = 'reel' | 'carousel';

export const CreatePostScreen = () => {
  const [kind, setKind] = useState<MediaKind>('reel');
  const [mediaPicked, setMediaPicked] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const canPost = mediaPicked && tags.length > 0 && !submitting;

  const submit = () => {
    setSubmitting(true);
    // TODO: swap for api.createPost(FormData) once the backend is live
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setMediaPicked(false);
        setCaption('');
        setTags([]);
      }, 1800);
    }, 1000);
  };

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
                onPress={() => setKind(key)}
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

        {/* Media picker */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Pressable
            onPress={() => setMediaPicked((v) => !v)}
            className="mt-5 rounded-3xl items-center justify-center"
            style={{
              height: 200,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: mediaPicked ? COLORS.primary : COLORS.border,
              backgroundColor: mediaPicked ? 'rgba(124,58,237,0.12)' : COLORS.surface,
            }}
          >
            {mediaPicked ? (
              <Animated.View entering={ZoomIn.duration(300)} className="items-center">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Ionicons name="checkmark" size={28} color="#fff" />
                </View>
                <Text className="text-white font-semibold mt-3">
                  {kind === 'reel' ? 'Video selected' : '3 photos selected'}
                </Text>
                <Text className="text-slate-500 text-xs mt-1">Tap to change</Text>
              </Animated.View>
            ) : (
              <View className="items-center">
                <Ionicons
                  name={kind === 'reel' ? 'videocam-outline' : 'images-outline'}
                  size={40}
                  color={COLORS.primaryLight}
                />
                <Text className="text-slate-300 font-semibold mt-3">
                  {kind === 'reel' ? 'Pick a short video' : 'Pick up to 10 photos'}
                </Text>
                <Text className="text-slate-500 text-xs mt-1">
                  From your camera roll · demo picker
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Caption */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} className="mt-5">
          <Text className="text-slate-300 font-semibold mb-2 text-sm">Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
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

        {/* Event tags — required, per the festival spec */}
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
                  onPress={() => toggleTag(event)}
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
          ) : (
            <GradientButton
              title={kind === 'reel' ? 'Post Reel' : 'Post Carousel'}
              onPress={submit}
              loading={submitting}
              disabled={!canPost}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};
