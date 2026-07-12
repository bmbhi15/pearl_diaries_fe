export interface User {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  dateOfBirth: string | null; // 'YYYY-MM-DD'
  collegeName: string | null;
  gender: string | null;
  interestedEvents: string[];
  createdAt: string;
}

export interface CarouselItem {
  uri: string;
  type: 'image' | 'video';
  duration: number | null; // ms
}

export interface PostContent {
  uri: string; // main media URL (video file / first slide)
  thumbnail?: string; // always set for videos (poster frame)
  duration?: number; // ms; videos only
  aspectRatio?: number; // width / height
  items?: CarouselItem[]; // carousels only, in display order
}

export interface Post {
  id: string;
  userId: string;
  user: User; // author summary, always populated
  type: 'video' | 'carousel';
  content: PostContent;
  caption: string | null;
  eventTags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean; // relative to the requesting user
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  text: string;
  likes: number; // reserved; currently always 0
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  description: string | null;
  image: string | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null; // opaque; pass back as ?cursor=; null = last page
}

export interface LikeResult {
  likes: number; // fresh count after the operation
  isLiked: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
}

export interface RegisterProfileRequest {
  name: string;
  email?: string;
  avatar?: string;
  dateOfBirth?: string; // 'YYYY-MM-DD'
  collegeName?: string;
  gender?: string;
  interestedEvents?: string[]; // max 5
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  dateOfBirth?: string;
  collegeName?: string;
  gender?: string;
  interestedEvents?: string[]; // max 5
}

export interface UploadSlotRequest {
  files: { fileName: string; contentType: string }[];
}

export interface UploadSlot {
  path: string; // storage object path — keep it for finalize
  uploadUrl: string; // presigned; PUT the raw file bytes here
  publicUrl: string; // final CDN URL after upload
}

export interface UploadSlotResponse {
  slots: UploadSlot[];
}

export interface CreatePostMedia {
  path: string; // from the upload slot
  type: 'image' | 'video';
  thumbnailPath?: string; // REQUIRED for video posts
  durationMs?: number;
  aspectRatio?: number;
}

export interface CreatePostRequest {
  type: 'video' | 'carousel';
  caption?: string;
  eventTags: string[]; // REQUIRED, non-empty
  venue?: string;
  media: CreatePostMedia[]; // ordered; carousel = one entry per slide
}
