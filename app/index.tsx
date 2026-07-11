import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import { View, Text, ActivityIndicator } from 'react-native';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const ClerkApp = () => {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Initialize app
  }, []);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!isSignedIn) {
    // Redirect to auth screens
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Sign In Required</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar barStyle="dark-content" />
    </NavigationContainer>
  );
};

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable'
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <ClerkApp />
    </ClerkProvider>
  );
}
