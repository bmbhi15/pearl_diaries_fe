import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const createPostSchema = yup.object({
  caption: yup.string(),
  eventTags: yup.string(),
});

type CreatePostFormData = yup.InferType<typeof createPostSchema>;

export const CreatePostScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm<CreatePostFormData>({
    resolver: yupResolver(createPostSchema),
  });

  const onSubmit = async (data: CreatePostFormData) => {
    setIsLoading(true);
    try {
      // API call to create post
      console.log('Create post:', data);
      // navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Create Post</Text>

        {/* Media Picker */}
        <Pressable className="bg-gray-100 p-12 rounded-lg items-center justify-center mb-6">
          <Text className="text-3xl mb-2">📷</Text>
          <Text className="text-gray-600 font-semibold">
            Select Photo or Video
          </Text>
        </Pressable>

        {/* Caption */}
        <Controller
          control={control}
          name="caption"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Caption</Text>
              <TextInput
                onChangeText={onChange}
                value={value}
                placeholder="Write a caption..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                className="border border-gray-300 p-3 rounded-lg text-gray-900"
              />
            </View>
          )}
        />

        {/* Event Tags */}
        <Controller
          control={control}
          name="eventTags"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                Event Tags
              </Text>
              <TextInput
                onChangeText={onChange}
                value={value}
                placeholder="e.g., Inauguration, Tech Fest (comma separated)"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 p-3 rounded-lg text-gray-900"
              />
            </View>
          )}
        />

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className={`p-4 rounded-lg items-center ${
            isLoading ? 'bg-gray-400' : 'bg-primary'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Post</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};
