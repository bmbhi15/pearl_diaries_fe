export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dateOfBirth?: string;
  collegeName?: string;
  gender?: string;
  interestedEvents?: string[];
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  type: 'video' | 'carousel';
  content: PostContent;
  caption?: string;
  eventTags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostContent {
  uri: string;
  thumbnail?: string;
  duration?: number;
  aspectRatio?: number;
  items?: CarouselItem[];
}

export interface CarouselItem {
  uri: string;
  type: 'image' | 'video';
  duration?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  text: string;
  likes: number;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  image?: string;
}

export interface VideoPreloadState {
  videoUri: string;
  state: 'idle' | 'preloading' | 'ready' | 'error';
  bufferedDuration: number;
}
