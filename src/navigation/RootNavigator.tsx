import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ReelsScreen } from '../screens/ReelsScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  Reels: { on: 'play-circle', off: 'play-circle-outline' },
  Explore: { on: 'grid', off: 'grid-outline' },
  Create: { on: 'add-circle', off: 'add-circle-outline' },
  Profile: { on: 'person', off: 'person-outline' },
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primaryLight,
      tabBarInactiveTintColor: '#64748B',
      tabBarStyle: {
        backgroundColor: COLORS.bg,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        elevation: 0,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Reels;
        return <Ionicons name={focused ? icons.on : icons.off} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Reels" component={ReelsScreen} />
    <Tab.Screen name="Explore" component={PostsScreen} />
    <Tab.Screen name="Create" component={CreatePostScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const RootNavigator = () => {
  const { stage } = useAuth();

  if (stage === 'loading') {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}
    >
      {stage === 'signedOut' && <Stack.Screen name="Login" component={LoginScreen} />}
      {stage === 'needsProfile' && (
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      )}
      {stage === 'signedIn' && <Stack.Screen name="Main" component={MainTabs} />}
    </Stack.Navigator>
  );
};
