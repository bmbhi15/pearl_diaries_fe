import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useClerk } from '@clerk/clerk-expo';

export const ProfileScreen = () => {
  const { user, signOut } = useClerk();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Profile</Text>

        <View className="bg-gray-100 p-4 rounded-lg mb-4">
          <Text className="text-gray-600 mb-2">Email</Text>
          <Text className="text-lg font-semibold">{user?.emailAddresses[0]?.emailAddress}</Text>
        </View>

        <View className="bg-gray-100 p-4 rounded-lg mb-6">
          <Text className="text-gray-600 mb-2">Name</Text>
          <Text className="text-lg font-semibold">{user?.fullName || 'Not set'}</Text>
        </View>

        <Pressable
          onPress={() => signOut()}
          className="bg-red-500 p-4 rounded-lg items-center"
        >
          <Text className="text-white font-bold text-lg">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
