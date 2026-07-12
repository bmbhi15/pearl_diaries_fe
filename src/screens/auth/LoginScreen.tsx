import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { makeRedirectUri } from 'expo-auth-session';
import { useOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
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
import { OtpSheet, OtpSubmitResult } from '../../components/OtpSheet';
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

const redirectUrl = makeRedirectUri({ scheme: 'pearldiaries', path: 'oauth-callback' });

const clerkErrorMessage = (err: unknown, fallback: string): string => {
  const first = (err as { errors?: Array<{ message?: string; longMessage?: string }> })
    ?.errors?.[0];
  return first?.longMessage ?? first?.message ?? fallback;
};

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();

  const [phone, setPhone] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpMode, setOtpMode] = useState<'signIn' | 'signUp' | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
      // else: user closed the browser before completing — not an error.
    } catch (err) {
      setGoogleError(clerkErrorMessage(err, 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePhoneContinue = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;

    const fullPhone = `+91${digits}`;
    setPhoneError(null);
    setPhoneSubmitting(true);
    try {
      // Try existing-account sign-in first.
      const attempt = await signIn.create({ identifier: fullPhone });
      const factor = attempt.supportedFirstFactors?.find(
        (f): f is typeof f & { phoneNumberId: string } =>
          f.strategy === 'phone_code' && 'phoneNumberId' in f
      );
      if (!factor) throw new Error('no-phone-factor');
      await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: factor.phoneNumberId });
      setOtpMode('signIn');
      setOtpVisible(true);
    } catch (err) {
      const code = (err as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code;
      if (code === 'form_identifier_not_found') {
        // No account with this number yet — create one.
        try {
          await signUp.create({ phoneNumber: fullPhone });
          await signUp.preparePhoneNumberVerification();
          setOtpMode('signUp');
          setOtpVisible(true);
        } catch (signUpErr) {
          setPhoneError(clerkErrorMessage(signUpErr, 'Could not send a code. Please try again.'));
        }
      } else {
        setPhoneError(clerkErrorMessage(err, 'Could not send a code. Please try again.'));
      }
    } finally {
      setPhoneSubmitting(false);
    }
  };

  const handleOtpSubmit = useCallback(
    async (code: string): Promise<OtpSubmitResult> => {
      try {
        if (otpMode === 'signIn' && signIn) {
          const result = await signIn.attemptFirstFactor({ strategy: 'phone_code', code });
          if (result.status === 'complete' && result.createdSessionId) {
            await setActiveSignIn({ session: result.createdSessionId });
            return { success: true };
          }
        } else if (otpMode === 'signUp' && signUp) {
          const result = await signUp.attemptPhoneNumberVerification({ code });
          if (result.status === 'complete' && result.createdSessionId) {
            await setActiveSignUp({ session: result.createdSessionId });
            return { success: true };
          }
        }
        return { success: false, message: 'That code didn’t match. Please try again.' };
      } catch (err) {
        return {
          success: false,
          message: clerkErrorMessage(err, 'That code didn’t match. Please try again.'),
        };
      }
    },
    [otpMode, signIn, signUp, setActiveSignIn, setActiveSignUp]
  );

  const handleOtpResend = useCallback(async () => {
    if (otpMode === 'signIn' && signIn) {
      const factor = signIn.supportedFirstFactors?.find(
        (f): f is typeof f & { phoneNumberId: string } =>
          f.strategy === 'phone_code' && 'phoneNumberId' in f
      );
      if (factor) {
        await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: factor.phoneNumberId });
      }
    } else if (otpMode === 'signUp' && signUp) {
      await signUp.preparePhoneNumberVerification();
    }
  }, [otpMode, signIn, signUp]);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Ambient animated background — the creative/tech spirit of BPHC */}
      <Orb size={280} colors={['#7C3AED', '#312E81']} top={-60} left={-80} duration={5200} drift={26} />
      <Orb size={200} colors={['#EC4899', '#7C3AED']} top={180} left={240} duration={6400} drift={-32} />
      <Orb size={160} colors={['#F59E0B', '#EC4899']} top={520} left={-40} duration={7200} drift={22} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
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
              variant="outline"
            />
            {googleError && (
              <Animated.Text entering={FadeIn} className="text-red-400 mt-2 ml-1 text-sm">
                {googleError}
              </Animated.Text>
            )}

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px" style={{ backgroundColor: COLORS.border }} />
              <Text className="text-slate-500 mx-4 text-xs font-semibold tracking-widest">
                OR
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: COLORS.border }} />
            </View>

            <View
              className="flex-row items-center rounded-2xl px-4"
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: phoneError ? '#F87171' : COLORS.border,
                height: 56,
              }}
            >
              <Text className="text-slate-300 font-semibold mr-3">+91</Text>
              <View className="w-px h-6 mr-3" style={{ backgroundColor: COLORS.border }} />
              <TextInput
                value={phone}
                onChangeText={(v) => {
                  setPhone(v.replace(/\D/g, '').slice(0, 10));
                  setPhoneError(null);
                }}
                placeholder="Mobile number"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                className="flex-1 text-white text-base"
              />
            </View>
            {phoneError && (
              <Animated.Text entering={FadeIn} className="text-red-400 mt-2 ml-1 text-sm">
                {phoneError}
              </Animated.Text>
            )}

            <View className="mt-4">
              <GradientButton
                title="Get OTP"
                icon="call-outline"
                onPress={handlePhoneContinue}
                loading={phoneSubmitting}
                disabled={phone.length !== 10}
              />
            </View>
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(600).duration(800)}
            className="text-slate-600 text-center text-xs mt-10"
          >
            Open to BITSians and visitors alike ✦ Pearl 2026
          </Animated.Text>
        </View>
      </KeyboardAvoidingView>

      <OtpSheet
        visible={otpVisible}
        phone={`+91 ${phone}`}
        onClose={() => setOtpVisible(false)}
        onVerified={() => setOtpVisible(false)}
        onSubmitCode={handleOtpSubmit}
        onResend={handleOtpResend}
      />
    </View>
  );
};
