import axios from 'axios';
import type {
  User,
  Post,
  Page,
  Comment,
  Event,
  LikeResult,
  RegisterProfileRequest,
  UpdateProfileRequest,
  UploadSlotResponse,
  CreatePostRequest,
} from '../types/index';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Clerk's session token is only reachable via the useAuth() hook, which
 * can't be called from a plain module like this one. AuthContext (which
 * already sits inside ClerkProvider) registers the live getToken function
 * here on mount so the request interceptor below can fetch a fresh token
 * per-request without needing React context itself.
 */
type TokenGetter = () => Promise<string | null>;
let getAuthToken: TokenGetter | null = null;

export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  getAuthToken = getter;
};

// GET /, GET /api/health, GET /events don't require a token — everything
// else does. Skipping the lookup for these avoids an unnecessary getToken()
// call before the user is signed in (e.g. the Explore screen's event chips
// loading before auth resolves).
const PUBLIC_PATHS = ['/api/health', '/events'];

apiClient.interceptors.request.use(
  async (config) => {
    const isPublic = PUBLIC_PATHS.some((p) => config.url?.startsWith(p));
    if (!isPublic) {
      const token = await getAuthToken?.();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const api = {
  // Auth / profile
  registerProfile: (data: RegisterProfileRequest) =>
    apiClient.post<User>('/auth/register-profile', data),
  getMyProfile: () => apiClient.get<User>('/users/me'), // 404 = needs onboarding
  updateProfile: (data: UpdateProfileRequest) => apiClient.put<User>('/users/profile', data),
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),

  // Feeds
  getReels: (limit = 20, cursor?: string) =>
    apiClient.get<Page<Post>>('/posts', { params: { limit, cursor } }),
  getExplore: (limit = 20, cursor?: string, eventTag?: string) =>
    apiClient.get<Page<Post>>('/posts/explore', { params: { limit, cursor, eventTag } }),
  getUserPosts: (userId: string, limit = 20, cursor?: string) =>
    apiClient.get<Page<Post>>(`/users/${userId}/posts`, { params: { limit, cursor } }),
  getPost: (id: string) => apiClient.get<Post>(`/posts/${id}`),

  // Upload + create (two-phase; no FormData)
  requestUploadSlots: (files: { fileName: string; contentType: string }[]) =>
    apiClient.post<UploadSlotResponse>('/uploads', { files }),
  finalizePost: (data: CreatePostRequest) => apiClient.post<Post>('/posts', data),
  deletePost: (id: string) => apiClient.delete(`/posts/${id}`),

  // Interactions
  likePost: (id: string) => apiClient.post<LikeResult>(`/posts/${id}/like`),
  unlikePost: (id: string) => apiClient.post<LikeResult>(`/posts/${id}/unlike`),
  getComments: (postId: string) => apiClient.get<Comment[]>(`/posts/${postId}/comments`),
  createComment: (postId: string, text: string) =>
    apiClient.post<Comment>(`/posts/${postId}/comments`, { text }),
  recordShare: (id: string) => apiClient.post(`/posts/${id}/share`),
  recordView: (id: string, watchMs?: number) =>
    apiClient.post(`/posts/${id}/view`, watchMs != null ? { watchMs } : {}),

  // Events + moderation
  getEvents: () => apiClient.get<Event[]>('/events'),
  report: (data: { postId?: string; userId?: string; reason?: string }) =>
    apiClient.post('/reports', data),
  blockUser: (id: string) => apiClient.post(`/users/${id}/block`),
};
