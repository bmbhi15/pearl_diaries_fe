import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSSO } from '@clerk/clerk-expo';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { PearlLogo } from '../../components/PearlLogo';
import { GradientButton } from '../../components/GradientButton';
import { COLORS } from '../../constants/theme';

/** A softly drifting gradient orb for the ambient background. */
const Orb = ({
  size,
  colors,
  top,
  left,
  duration,
  drift,
}: {
  size: number;
  colors: readonly [string, string];
  top: number;
  left: number;
  duration: number;
  drift: number;
}) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [t, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: t.value * drift }, { translateX: t.value * drift * 0.6 }],
  }));

  return (
    <Animated.View style={[style, { position: 'absolute', top, left, opacity: 0.3 }]}>
      <LinearGradient
        colors={colors}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
};

const clerkErrorMessage = (err: unknown, fallback: string): string => {
  const first = (err as { errors?: Array<{ message?: string; longMessage?: string }> })
    ?.errors?.[0];
  return first?.longMessage ?? first?.message ?? fallback;
};

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { startSSOFlow } = useSSO();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      // No explicit redirectUrl: let Clerk derive it from app.json's
      // "scheme" (its own default is `<scheme>://sso-callback`), so the
      // URL this promise waits for always matches what Clerk itself opens.
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
        strategy: 'oauth_google',
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return;
      }

      // No session and no exception thrown — this used to fail silently,
      // which is indistinguishable from "stuck" in the UI. Log what Clerk's
      // WebBrowser session actually reported (visible in the Metro/dev-client
      // terminal) and only skip the error if the user genuinely dismissed it.
      console.log('[Google SSO] no session created — authSessionResult:', authSessionResult);
      const resultType = authSessionResult?.type;
      if (resultType !== 'cancel' && resultType !== 'dismiss') {
        setGoogleError(
          `Sign-in didn't complete (${resultType ?? 'unknown'}). Check the Metro logs for details.`
        );
      }
    } catch (err) {
      console.log('[Google SSO] threw:', err);
      setGoogleError(clerkErrorMessage(err, 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Ambient animated background — the creative/tech spirit of BPHC */}
      <Orb size={280} colors={['#7C3AED', '#312E81']} top={-60} left={-80} duration={5200} drift={26} />
      <Orb size={200} colors={['#EC4899', '#7C3AED']} top={180} left={240} duration={6400} drift={-32} />
      <Orb size={160} colors={['#F59E0B', '#EC4899']} top={520} left={-40} duration={7200} drift={22} />

      <View
        className="flex-1 px-7 justify-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <Animated.View entering={FadeInDown.duration(700).springify()} className="items-center">
          <PearlLogo size={92} />
          <Text className="text-white text-4xl font-extrabold mt-6 tracking-tight">
            Pearl Diaries
          </Text>
          <Text className="text-slate-400 text-center mt-3 leading-6 px-4">
            Capture and relive every moment of{' '}
            <Text style={{ color: COLORS.primaryLight }} className="font-semibold">
              Pearl
            </Text>
            , BITS Pilani Hyderabad’s cultural festival.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(700).springify()} className="mt-12">
          <GradientButton
            title="Continue with Google"
            icon="logo-google"
            onPress={handleGoogle}
            loading={googleLoading}
          />
          {googleError && (
            <Animated.Text entering={FadeIn} className="text-red-400 mt-3 text-center text-sm">
              {googleError}
            </Animated.Text>
          )}
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(600).duration(800)}
          className="text-slate-600 text-center text-xs mt-10"
        >
          Open to BITSians and visitors alike ✦ Pearl 2026
        </Animated.Text>
      </View>
    </View>
  );
};
