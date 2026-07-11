import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

export interface UserProfile {
  name: string;
  dateOfBirth: string;
  collegeName: string;
  gender: string;
  events: string[];
}

interface Session {
  method: 'google' | 'phone';
  phone?: string;
  email?: string;
  profile?: UserProfile;
}

export type AuthStage = 'loading' | 'signedOut' | 'needsProfile' | 'signedIn';

interface AuthContextValue {
  stage: AuthStage;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  completeProfile: (profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'pearl.session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [stage, setStage] = useState<AuthStage>('loading');
  const [session, setSession] = useState<Session | null>(null);

  // Restore persisted session on launch
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: Session = JSON.parse(raw);
          setSession(saved);
          setStage(saved.profile ? 'signedIn' : 'needsProfile');
        } else {
          setStage('signedOut');
        }
      } catch {
        setStage('signedOut');
      }
    })();
  }, []);

  const persist = useCallback(async (next: Session | null) => {
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // TODO: swap for Clerk Google OAuth once keys are configured
    const next: Session = { method: 'google', email: 'student@hyderabad.bits-pilani.ac.in' };
    setSession(next);
    setStage('needsProfile');
    await persist(next);
  }, [persist]);

  const signInWithPhone = useCallback(
    async (phone: string) => {
      // Called after OTP verification succeeds
      const next: Session = { method: 'phone', phone };
      setSession(next);
      setStage('needsProfile');
      await persist(next);
    },
    [persist]
  );

  const completeProfile = useCallback(
    async (profile: UserProfile) => {
      const next: Session = { ...(session ?? { method: 'phone' }), profile };
      setSession(next);
      setStage('signedIn');
      await persist(next);
      // Fire-and-forget: register profile with the backend when available
      api.registerProfile(profile).catch(() => {});
    },
    [persist, session]
  );

  const signOut = useCallback(async () => {
    setSession(null);
    setStage('signedOut');
    await persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({ stage, session, signInWithGoogle, signInWithPhone, completeProfile, signOut }),
    [stage, session, signInWithGoogle, signInWithPhone, completeProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
