import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { api, setAuthTokenGetter } from '../utils/api';
import type { User } from '../types/index';

/** Shape ProfileSetupScreen collects — translated to the backend's field
 * names (events -> interestedEvents) inside completeProfile below. */
export interface ProfileDraft {
  name: string;
  dateOfBirth: string;
  collegeName: string;
  gender: string;
  events: string[];
}

interface Session {
  clerkUserId: string;
  email?: string;
  /** The real backend User record once profile setup is complete. */
  profile?: User;
}

export type AuthStage = 'loading' | 'signedOut' | 'needsProfile' | 'signedIn';

interface AuthContextValue {
  stage: AuthStage;
  session: Session | null;
  completeProfile: (draft: ProfileDraft) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Bridges Clerk's session state into the app's four-stage flow. Clerk owns
 * "is this a valid, signed-in user" — this provider owns the app-specific
 * question of "has that user finished onboarding", answered by calling the
 * real backend (GET /users/me: 404 = needs onboarding, 200 = signed in).
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isLoaded: authLoaded,
    isSignedIn,
    userId,
    signOut: clerkSignOut,
    getToken,
  } = useClerkAuth();
  const { user } = useUser();

  const [stage, setStage] = useState<AuthStage>('loading');
  const [profile, setProfile] = useState<User | undefined>(undefined);

  // Give the plain axios module a way to fetch a live Clerk session token
  // (getToken only exists via this hook, api.ts can't call it directly).
  useEffect(() => {
    setAuthTokenGetter(isSignedIn ? getToken : null);
    return () => setAuthTokenGetter(null);
  }, [isSignedIn, getToken]);

  // Once Clerk resolves, ask the backend whether this user has a profile.
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
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.getMyProfile();
        if (cancelled) return;
        setProfile(data);
        setStage('signedIn');
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setProfile(undefined);
          setStage('needsProfile');
        } else {
          // Network hiccup / transient 5xx: fall back to the onboarding
          // form rather than getting stuck. Registration is idempotent
          // server-side, so resubmitting is harmless if a profile already
          // exists.
          console.log('[Auth] getMyProfile failed, routing to onboarding:', err);
          setProfile(undefined);
          setStage('needsProfile');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, isSignedIn, userId]);

  const completeProfile = useCallback(async (draft: ProfileDraft) => {
    const { data } = await api.registerProfile({
      name: draft.name,
      dateOfBirth: draft.dateOfBirth,
      collegeName: draft.collegeName,
      gender: draft.gender,
      interestedEvents: draft.events,
    });
    setProfile(data);
    setStage('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    setProfile(undefined);
    await clerkSignOut();
    setStage('signedOut');
  }, [clerkSignOut]);

  const session: Session | null = userId
    ? {
        clerkUserId: userId,
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
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
