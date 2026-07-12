import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { api } from '../utils/api';

export interface UserProfile {
  name: string;
  dateOfBirth: string;
  collegeName: string;
  gender: string;
  events: string[];
}

interface Session {
  clerkUserId: string;
  email?: string;
  phone?: string;
  profile?: UserProfile;
}

export type AuthStage = 'loading' | 'signedOut' | 'needsProfile' | 'signedIn';

interface AuthContextValue {
  stage: AuthStage;
  session: Session | null;
  completeProfile: (profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

const profileKey = (clerkUserId: string) => `pearl.profile.${clerkUserId}`;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Bridges Clerk's session state into the app's four-stage flow. Clerk owns
 * "is this a valid, signed-in user" — this provider owns the app-specific
 * question of "has that user finished onboarding".
 *
 * Profile storage is a local cache keyed by Clerk user id until the real
 * backend exists (docs/BACKEND_API.md #1 registerProfile / #2 fetch own
 * profile) — swap the AsyncStorage calls below for `api.*` then.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded: authLoaded, isSignedIn, userId, signOut: clerkSignOut } = useClerkAuth();
  const { user } = useUser();

  const [stage, setStage] = useState<AuthStage>('loading');
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);

  // Once Clerk resolves, figure out which stage we're in.
  useEffect(() => {
    if (!authLoaded) {
      setStage('loading');
      return;
    }
    if (!isSignedIn || !userId) {
      setProfile(undefined);
      setStage('signedOut');
      return;
    }
    (async () => {
      // TODO(backend): replace with api.getOwnProfile() once #2 exists.
      const raw = await AsyncStorage.getItem(profileKey(userId));
      if (raw) {
        setProfile(JSON.parse(raw));
        setStage('signedIn');
      } else {
        setStage('needsProfile');
      }
    })();
  }, [authLoaded, isSignedIn, userId]);

  const completeProfile = useCallback(
    async (next: UserProfile) => {
      if (!userId) return;
      await AsyncStorage.setItem(profileKey(userId), JSON.stringify(next));
      setProfile(next);
      setStage('signedIn');
      // Fire-and-forget: register with the backend when #1 exists.
      api.registerProfile(next).catch(() => {});
    },
    [userId]
  );

  const signOut = useCallback(async () => {
    if (userId) await AsyncStorage.removeItem(profileKey(userId));
    setProfile(undefined);
    await clerkSignOut();
    setStage('signedOut');
  }, [userId, clerkSignOut]);

  const session: Session | null = userId
    ? {
        clerkUserId: userId,
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
        phone: user?.primaryPhoneNumber?.phoneNumber ?? undefined,
        profile,
      }
    : null;

  const value = useMemo(
    () => ({ stage, session, completeProfile, signOut }),
    [stage, session, completeProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
