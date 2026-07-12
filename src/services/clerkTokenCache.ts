import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo';

/** Persists Clerk's session JWT in the platform keychain, not AsyncStorage. */
export const clerkTokenCache: TokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Best-effort: a failed write just means a re-login next launch.
    }
  },
  async clearToken(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // no-op
    }
  },
};
