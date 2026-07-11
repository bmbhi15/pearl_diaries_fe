import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export const ProfileScreen = () => {
  const mockUser = {
    name: 'Demo User',
    email: 'demo@pearlfestival.com',
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Profile</Text>

        <View className="bg-gray-100 p-4 rounded-lg mb-4">
          <Text className="text-gray-600 mb-2">Email</Text>
          <Text className="text-lg font-semibold">{mockUser.email}</Text>
        </View>

        <View className="bg-gray-100 p-4 rounded-lg mb-6">
          <Text className="text-gray-600 mb-2">Name</Text>
          <Text className="text-lg font-semibold">{mockUser.name}</Text>
        </View>

        <Pressable
          onPress={() => console.log('Sign out')}
          className="bg-red-500 p-4 rounded-lg items-center"
        >
          <Text className="text-white font-bold text-lg">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
