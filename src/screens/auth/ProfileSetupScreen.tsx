import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
} from 'react-native-reanimated';
import { PearlLogo } from '../../components/PearlLogo';
import { GradientButton } from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, PEARL_EVENTS } from '../../constants/theme';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
const MAX_EVENTS = 5;

const detailsSchema = yup.object({
  name: yup.string().trim().min(2, 'Tell us your name').required('Tell us your name'),
  dateOfBirth: yup
    .string()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, 'Use DD/MM/YYYY')
    .test('valid-date', 'That date doesn’t look right', (v) => {
      if (!v) return false;
      const [d, m, y] = v.split('/').map(Number);
      const date = new Date(y, m - 1, d);
      return (
        date.getDate() === d &&
        date.getMonth() === m - 1 &&
        y >= 1950 &&
        date.getTime() < Date.now()
      );
    })
    .required('Add your date of birth'),
  collegeName: yup.string().trim().min(2, 'Add your college').required('Add your college'),
  gender: yup.string().oneOf([...GENDERS], 'Pick one').required('Pick one'),
});

type DetailsForm = yup.InferType<typeof detailsSchema>;

/** Auto-insert slashes while typing a DD/MM/YYYY date. */
const formatDob = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

/** DD/MM/YYYY (the form's editable format) -> YYYY-MM-DD (the API's). */
const toIsoDate = (ddmmyyyy: string) => {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m}-${d}`;
};

const Field = ({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  children: React.ReactNode;
}) => (
  <View className="mb-5">
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon} size={14} color={COLORS.primaryLight} />
      <Text className="text-slate-300 font-semibold ml-2 text-sm">{label}</Text>
    </View>
    {children}
    {error && <Text className="text-red-400 text-xs mt-1.5 ml-1">{error}</Text>}
  </View>
);

const inputStyle = (hasError: boolean) => ({
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: hasError ? '#F87171' : COLORS.border,
  borderRadius: 16,
  paddingHorizontal: 16,
  height: 54,
  color: COLORS.text,
  fontSize: 16,
});

export const ProfileSetupScreen = () => {
  const insets = useSafeAreaInsets();
  const { completeProfile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [details, setDetails] = useState<DetailsForm | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: yupResolver(detailsSchema),
    defaultValues: { name: '', dateOfBirth: '', collegeName: '', gender: undefined },
  });

  const onDetailsNext = (data: DetailsForm) => {
    setDetails(data);
    setStep(2);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : prev.length < MAX_EVENTS
          ? [...prev, event]
          : prev
    );
  };

  const onFinish = async () => {
    if (!details) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await completeProfile({
        ...details,
        dateOfBirth: toIsoDate(details.dateOfBirth),
        events: selectedEvents,
      });
    } catch (err: any) {
      console.log('[ProfileSetup] registerProfile failed:', err);
      setSubmitError(
        err?.response?.data?.message ?? 'Couldn’t save your profile. Please try again.'
      );
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}>
      {/* Header with progress */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <PearlLogo size={36} />
        <View className="flex-row items-center">
          {[1, 2].map((s) => (
            <View
              key={s}
              className="h-1.5 rounded-full ml-2"
              style={{
                width: s === step ? 28 : 14,
                backgroundColor: s <= step ? COLORS.primary : COLORS.surfaceLight,
              }}
            />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {step === 1 ? (
          <ScrollView
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(500)}>
              <Text className="text-white text-3xl font-extrabold mt-6">Tell us about you</Text>
              <Text className="text-slate-400 mt-2 mb-8">
                A few basics to set up your festival profile.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(500)}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Field label="Full name" icon="person-outline" error={errors.name?.message}>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. Ananya Sharma"
                      placeholderTextColor="#64748B"
                      style={inputStyle(!!errors.name)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <Field
                    label="Date of birth"
                    icon="calendar-outline"
                    error={errors.dateOfBirth?.message}
                  >
                    <TextInput
                      value={value}
                      onChangeText={(v) => onChange(formatDob(v))}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#64748B"
                      keyboardType="number-pad"
                      maxLength={10}
                      style={inputStyle(!!errors.dateOfBirth)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="collegeName"
                render={({ field: { onChange, value } }) => (
                  <Field label="College" icon="school-outline" error={errors.collegeName?.message}>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. BITS Pilani, Hyderabad Campus"
                      placeholderTextColor="#64748B"
                      style={inputStyle(!!errors.collegeName)}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <Field label="Gender" icon="sparkles-outline" error={errors.gender?.message}>
                    <View className="flex-row flex-wrap">
                      {GENDERS.map((g) => {
                        const active = value === g;
                        return (
                          <Pressable
                            key={g}
                            onPress={() => onChange(g)}
                            className="mr-2 mb-2 px-4 py-2.5 rounded-full"
                            style={{
                              backgroundColor: active ? COLORS.primary : COLORS.surface,
                              borderWidth: 1,
                              borderColor: active ? COLORS.primary : COLORS.border,
                            }}
                          >
                            <Text
                              className={active ? 'text-white font-semibold' : 'text-slate-300'}
                            >
                              {g}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Field>
                )}
              />

              <View className="mt-2 mb-10">
                <GradientButton title="Continue" onPress={handleSubmit(onDetailsNext)} />
              </View>
            </Animated.View>
          </ScrollView>
        ) : (
          <Animated.View
            entering={FadeInRight.duration(400)}
            exiting={FadeOutLeft.duration(300)}
            className="flex-1 px-6"
          >
            <Text className="text-white text-3xl font-extrabold mt-6">
              What are you excited for?
            </Text>
            <Text className="text-slate-400 mt-2">
              Pick your top {MAX_EVENTS} events ·{' '}
              <Text style={{ color: COLORS.primaryLight }} className="font-bold">
                {selectedEvents.length}/{MAX_EVENTS}
              </Text>
            </Text>

            <ScrollView className="mt-6 flex-1" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap">
                {PEARL_EVENTS.map((event, i) => {
                  const active = selectedEvents.includes(event);
                  const rank = selectedEvents.indexOf(event);
                  return (
                    <Animated.View
                      key={event}
                      entering={FadeInDown.delay(i * 60).duration(400)}
                      layout={LinearTransition.springify()}
                    >
                      <Pressable
                        onPress={() => toggleEvent(event)}
                        className="mr-2.5 mb-3 px-4 py-3 rounded-2xl flex-row items-center"
                        style={{
                          backgroundColor: active ? 'rgba(124,58,237,0.25)' : COLORS.surface,
                          borderWidth: 1.5,
                          borderColor: active ? COLORS.primary : COLORS.border,
                        }}
                      >
                        {active && (
                          <View
                            className="w-5 h-5 rounded-full items-center justify-center mr-2"
                            style={{ backgroundColor: COLORS.primary }}
                          >
                            <Text className="text-white text-[10px] font-bold">{rank + 1}</Text>
                          </View>
                        )}
                        <Text
                          className={active ? 'text-white font-semibold' : 'text-slate-300'}
                        >
                          {event}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </ScrollView>

            <View className="pb-8 pt-2">
              {submitError && (
                <Text className="text-red-400 text-sm text-center mb-3">{submitError}</Text>
              )}
              <GradientButton
                title={
                  selectedEvents.length === 0
                    ? 'Pick at least one event'
                    : `Let’s go! (${selectedEvents.length} picked)`
                }
                onPress={onFinish}
                loading={submitting}
                disabled={selectedEvents.length === 0}
              />
              <Pressable onPress={() => setStep(1)} className="items-center mt-4" hitSlop={8}>
                <Text className="text-slate-500 font-semibold">← Back to details</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};
