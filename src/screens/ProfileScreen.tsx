import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { COLORS, GRADIENTS } from '../constants/theme';

const initialsOf = (name?: string) =>
  (name ?? 'PD')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const STATS = [
  { label: 'Posts', value: '12' },
  { label: 'Followers', value: '348' },
  { label: 'Following', value: '221' },
];

export const ProfileScreen = () => {
  const { session, signOut } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const profile = session?.profile;

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <ScreenHeader title="Profile" />
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <Animated.View
          entering={FadeInDown.duration(450)}
          className="items-center rounded-3xl py-8 mt-5"
          style={{ backgroundColor: COLORS.surface }}
        >
          <LinearGradient
            colors={GRADIENTS.brand}
            style={{ width: 96, height: 96, borderRadius: 48, padding: 3 }}
          >
            <View
              className="flex-1 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.surfaceLight }}
            >
              <Text className="text-white text-3xl font-extrabold">
                {initialsOf(profile?.name)}
              </Text>
            </View>
          </LinearGradient>

          <Text className="text-white text-2xl font-extrabold mt-4">
            {profile?.name ?? 'Pearl Explorer'}
          </Text>
          <View className="flex-row items-center mt-1.5">
            <Ionicons name="school-outline" size={13} color={COLORS.textMuted} />
            <Text className="text-slate-400 ml-1.5">
              {profile?.collegeName ?? 'Festival visitor'}
            </Text>
          </View>
          {session?.email && (
            <Text className="text-slate-500 text-xs mt-1">{session.email}</Text>
          )}

          <View className="flex-row mt-6 w-full px-8 justify-between">
            {STATS.map((s) => (
              <View key={s.label} className="items-center">
                <Text className="text-white text-xl font-extrabold">{s.value}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Excited-for events */}
        {profile?.interestedEvents && profile.interestedEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(450)} className="mt-5">
            <Text className="text-slate-300 font-semibold mb-3">Excited for</Text>
            <View className="flex-row flex-wrap">
              {profile.interestedEvents.map((event, i) => (
                <View
                  key={event}
                  className="flex-row items-center rounded-full px-3.5 py-2 mr-2 mb-2"
                  style={{
                    backgroundColor: 'rgba(124,58,237,0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(124,58,237,0.5)',
                  }}
                >
                  <Text className="text-purple-300 text-xs font-bold mr-1.5">#{i + 1}</Text>
                  <Text className="text-purple-100 text-sm">{event}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Sign out with inline confirmation */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)} className="mt-8 mb-12">
          {confirmingSignOut ? (
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }}
            >
              <Text className="text-slate-200 font-semibold text-center mb-4">
                Sign out of Pearl Diaries?
              </Text>
              <View className="flex-row">
                <Pressable
                  onPress={() => setConfirmingSignOut(false)}
                  className="flex-1 py-3 rounded-xl items-center mr-2"
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  <Text className="text-slate-300 font-semibold">Stay</Text>
                </Pressable>
                <Pressable
                  onPress={signOut}
                  className="flex-1 py-3 rounded-xl items-center ml-2"
                  style={{ backgroundColor: '#7F1D1D' }}
                >
                  <Text className="text-red-200 font-semibold">Sign out</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirmingSignOut(true)}
              className="flex-row items-center justify-center py-4 rounded-2xl"
              style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }}
            >
              <Ionicons name="log-out-outline" size={19} color="#F87171" />
              <Text className="text-red-400 font-bold ml-2">Sign out</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};
