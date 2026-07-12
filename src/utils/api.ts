import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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
 * here on mount so the axios interceptor below can fetch a fresh token
 * per-request without needing React context itself.
 */
type TokenGetter = () => Promise<string | null>;
let getAuthToken: TokenGetter | null = null;

export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  getAuthToken = getter;
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  // Auth
  registerProfile: (data: any) =>
    apiClient.post('/auth/register-profile', data),

  // Posts
  getPosts: (limit = 20, offset = 0) =>
    apiClient.get('/posts', { params: { limit, offset } }),
  getPost: (id: string) => apiClient.get(`/posts/${id}`),
  createPost: (data: FormData) =>
    apiClient.post('/posts', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  likePost: (id: string) => apiClient.post(`/posts/${id}/like`),
  unlikePost: (id: string) => apiClient.post(`/posts/${id}/unlike`),

  // Comments
  getComments: (postId: string) =>
    apiClient.get(`/posts/${postId}/comments`),
  createComment: (postId: string, text: string) =>
    apiClient.post(`/posts/${postId}/comments`, { text }),

  // User
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),

  // Events
  getEvents: () => apiClient.get('/events'),
};
