import './global.css';
import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { ClerkProvider } from '@clerk/clerk-expo';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { clerkTokenCache } from './src/services/clerkTokenCache';
import { COLORS } from './src/constants/theme';

// Required once at module scope so the OAuth browser tab closes itself and
// hands control back to the app after Google redirects to our URL scheme.
WebBrowser.maybeCompleteAuthSession();

const PearlTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bg,
    card: COLORS.bg,
    border: COLORS.border,
    primary: COLORS.primary,
    text: COLORS.text,
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — set it in .env.local (see .env.example).'
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={clerkTokenCache}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={PearlTheme}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </AuthProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
