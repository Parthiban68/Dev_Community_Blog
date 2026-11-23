import { createContext, useContext } from 'react';
import type {
  AuthStatus,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  SessionOutcome,
} from './auth.types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  requiresOnboarding: boolean;
  login: (payload: LoginPayload) => Promise<SessionOutcome>;
  register: (payload: RegisterPayload) => Promise<SessionOutcome>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setUser: (user: AuthUser | null) => void;
  completeOnboarding: () => Promise<'completed' | 'unavailable'>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
