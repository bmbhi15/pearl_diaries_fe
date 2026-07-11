import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PearlLogo } from './PearlLogo';
import { COLORS } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

/** Safe-area-aware screen header with the brand mark. */
export const ScreenHeader = ({ title, subtitle, right }: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
      className="px-5 pb-3.5"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <PearlLogo size={34} />
          <View className="ml-3 flex-1">
            <Text className="text-white text-xl font-extrabold tracking-tight">{title}</Text>
            {subtitle && <Text className="text-slate-500 text-xs mt-0.5">{subtitle}</Text>}
          </View>
        </View>
        {right}
      </View>
    </View>
  );
};
