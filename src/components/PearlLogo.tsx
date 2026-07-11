import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../constants/theme';

interface PearlLogoProps {
  size?: number;
  showWordmark?: boolean;
}

/**
 * Code-drawn Pearl Diaries logo: a lustrous pearl inside a brand-gradient
 * ring, with an optional wordmark. Used until final artwork assets land.
 */
export const PearlLogo = ({ size = 48, showWordmark = false }: PearlLogoProps) => {
  const ring = size;
  const pearl = size * 0.72;
  const highlight = size * 0.2;

  return (
    <View className="flex-row items-center">
      <LinearGradient
        colors={GRADIENTS.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearGradient
          colors={GRADIENTS.pearl}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            width: pearl,
            height: pearl,
            borderRadius: pearl / 2,
            overflow: 'hidden',
          }}
        >
          {/* Specular highlight that sells the "pearl" */}
          <View
            style={{
              position: 'absolute',
              top: pearl * 0.16,
              left: pearl * 0.2,
              width: highlight,
              height: highlight,
              borderRadius: highlight / 2,
              backgroundColor: 'rgba(255,255,255,0.95)',
            }}
          />
        </LinearGradient>
      </LinearGradient>

      {showWordmark && (
        <View className="ml-3">
          <Text
            className="text-white font-extrabold"
            style={{ fontSize: size * 0.42, letterSpacing: 0.5 }}
          >
            Pearl Diaries
          </Text>
          <Text
            className="text-slate-400 font-medium"
            style={{ fontSize: size * 0.2, letterSpacing: 2 }}
          >
            BITS PILANI · HYDERABAD
          </Text>
        </View>
      )}
    </View>
  );
};
