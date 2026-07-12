import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export type OtpSubmitResult = { success: true } | { success: false; message: string };

interface OtpSheetProps {
  visible: boolean;
  phone: string;
  onClose: () => void;
  onVerified: () => void;
  /** Calls the real Clerk verification for the current sign-in/sign-up attempt. */
  onSubmitCode: (code: string) => Promise<OtpSubmitResult>;
  /** Re-triggers Clerk's prepare step to send a fresh code. */
  onResend: () => Promise<void>;
}

/**
 * Bottom-overlay OTP entry sheet.
 * Handles the full interaction matrix: wrong-code error (shake + clear),
 * resend cooldown, hardware back / backdrop / close-button dismissal with a
 * discard-confirmation when digits have already been typed. Verification
 * itself is delegated to the caller (real Clerk phone_code attempt).
 */
export const OtpSheet = ({
  visible,
  phone,
  onClose,
  onVerified,
  onSubmitCode,
  onResend,
}: OtpSheetProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const translateY = useSharedValue(600);
  const backdrop = useSharedValue(0);
  const shakeX = useSharedValue(0);

  // Reset state on every open, then animate in
  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
      setVerifying(false);
      setConfirmDiscard(false);
      setResendIn(RESEND_SECONDS);
      translateY.value = withSpring(0, { damping: 18, stiffness: 160 });
      backdrop.value = withTiming(1, { duration: 220 });
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [visible, translateY, backdrop]);

  // Resend countdown
  useEffect(() => {
    if (!visible || resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [visible, resendIn]);

  const animateOut = useCallback(
    (after: () => void) => {
      backdrop.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 240 }, (finished) => {
        if (finished) runOnJS(after)();
      });
    },
    [backdrop, translateY]
  );

  /** Close request from backdrop / X / hardware back. */
  const requestClose = useCallback(() => {
    if (verifying) return; // don't allow dismissal mid-verification
    if (code.length > 0 && !confirmDiscard) {
      setConfirmDiscard(true); // first attempt: ask before discarding typed digits
      return;
    }
    animateOut(onClose);
  }, [verifying, code.length, confirmDiscard, animateOut, onClose]);

  // Android hardware back button
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, requestClose]);

  const shake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  const verify = useCallback(
    async (candidate: string) => {
      setVerifying(true);
      setError(null);
      try {
        const result = await onSubmitCode(candidate);
        if (result.success) {
          animateOut(onVerified);
        } else {
          setVerifying(false);
          setCode('');
          setError(result.message);
          shake();
          inputRef.current?.focus();
        }
      } catch {
        setVerifying(false);
        setCode('');
        setError('Something went wrong verifying that code. Please try again.');
        shake();
        inputRef.current?.focus();
      }
    },
    [onSubmitCode, animateOut, onVerified, shake]
  );

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
    setError(null);
    setConfirmDiscard(false);
    if (digits.length === OTP_LENGTH) verify(digits);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setResendIn(RESEND_SECONDS);
      setCode('');
      setError(null);
    } catch {
      setError('Couldn’t resend right now. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const boxRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={requestClose}>
      <View className="flex-1 justify-end">
        <Animated.View
          style={[backdropStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
        >
          <Pressable
            onPress={requestClose}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={[
              sheetStyle,
              {
                backgroundColor: COLORS.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingBottom: 34,
              },
            ]}
          >
            {/* Grab handle + close */}
            <View className="items-center pt-3">
              <View className="w-10 h-1.5 rounded-full bg-slate-600" />
            </View>
            <Pressable
              onPress={requestClose}
              hitSlop={12}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-700/60 items-center justify-center"
            >
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </Pressable>

            <View className="px-6 pt-6">
              <Text className="text-white text-xl font-bold">Verify your number</Text>
              <Text className="text-slate-400 mt-1.5 leading-5">
                Enter the 6-digit code sent to{' '}
                <Text className="text-slate-200 font-semibold">{phone}</Text>
              </Text>

              {/* OTP boxes over a single hidden input — natural backspace handling */}
              <Pressable onPress={() => inputRef.current?.focus()} className="mt-6">
                <Animated.View style={boxRowStyle} className="flex-row justify-between">
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const filled = i < code.length;
                    const active = i === code.length && !verifying;
                    return (
                      <View
                        key={i}
                        style={{
                          width: 46,
                          height: 56,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: COLORS.surfaceLight,
                          borderColor: error
                            ? '#F87171'
                            : active
                              ? COLORS.primary
                              : filled
                                ? COLORS.primaryLight
                                : COLORS.border,
                        }}
                      >
                        <Text className="text-white text-2xl font-bold">{code[i] ?? ''}</Text>
                      </View>
                    );
                  })}
                </Animated.View>
              </Pressable>
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleChange}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus={false}
                style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
              />

              {/* Error / verifying / discard-confirm states */}
              <View className="mt-4 min-h-[24px]">
                {verifying && (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color={COLORS.primaryLight} />
                    <Text className="text-slate-300 ml-2">Verifying…</Text>
                  </View>
                )}
                {error && !verifying && <Text className="text-red-400">{error}</Text>}
                {confirmDiscard && !verifying && (
                  <View className="flex-row items-center justify-between bg-slate-800/80 rounded-xl px-4 py-3">
                    <Text className="text-slate-200 flex-1 mr-3">Discard verification?</Text>
                    <Pressable onPress={() => setConfirmDiscard(false)} hitSlop={8}>
                      <Text className="text-slate-400 font-semibold mr-4">Stay</Text>
                    </Pressable>
                    <Pressable onPress={() => animateOut(onClose)} hitSlop={8}>
                      <Text className="text-red-400 font-semibold">Discard</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Resend with cooldown */}
              <View className="flex-row items-center mt-2">
                <Text className="text-slate-500">Didn’t get it? </Text>
                {resendIn > 0 ? (
                  <Text className="text-slate-500">Resend in {resendIn}s</Text>
                ) : resending ? (
                  <ActivityIndicator size="small" color={COLORS.primaryLight} />
                ) : (
                  <Pressable onPress={handleResend} hitSlop={8}>
                    <Text style={{ color: COLORS.primaryLight }} className="font-semibold">
                      Resend code
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
