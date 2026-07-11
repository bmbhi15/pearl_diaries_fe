import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, GRADIENTS } from '../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'outline';
}

/** Brand CTA button with a springy press-scale micro-animation. */
export const GradientButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
}: GradientButtonProps) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inner = (
    <View className="flex-row items-center justify-center py-4 px-6">
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
          <Text className="text-white font-bold text-base">{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
    >
      <Animated.View style={[animatedStyle, { opacity: disabled ? 0.5 : 1 }]}>
        {variant === 'primary' ? (
          <LinearGradient
            colors={GRADIENTS.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.surface,
            }}
          >
            {inner}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};
