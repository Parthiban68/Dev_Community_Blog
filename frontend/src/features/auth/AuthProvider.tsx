import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { registerAuthRefreshHandler } from '../../lib/api';
import { AuthContext, type AuthContextValue } from './auth-context';
import { isNotFoundError } from './auth.errors';
import {
  completeOnboarding as completeOnboardingRequest,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  register as registerRequest,
} from './auth.service';
import { clearAuthTokens } from './auth-store';
import type {
  AuthStatus,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  SessionOutcome,
  SessionRecords,
} from './auth.types';

let restorePromise: Promise<SessionRecords | null> | null = null;

function restoreSessionOnce(): Promise<SessionRecords | null> {
  if (!restorePromise) {
    const attempt = (async () => {
      try {
        return await refreshSession();
      } catch {
        clearAuthTokens();
        return null;
      }
    })();
    restorePromise = attempt;
    void attempt.then(() => {
      if (restorePromise === attempt) {
        restorePromise = null;
      }
    });
  }
  return restorePromise;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const applySession = useCallback((records: SessionRecords): SessionOutcome => {
    const onboardingNeeded =
      records.requiresOnboarding ?? records.user.onboardingCompleted === false;
    setUserState(records.user);
    setRequiresOnboarding(onboardingNeeded);
    setStatus('authenticated');
    return {
      requiresOnboarding: onboardingNeeded,
      emailVerificationRequired:
        records.emailVerificationRequired ?? records.user.emailVerified === false,
      deliveryConfigured: records.deliveryConfigured ?? false,
    };
  }, []);

  const refresh = useCallback((): Promise<boolean> => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const attempt = (async () => {
      try {
        const records = await refreshSession();
        const nextUser = records.user ?? (await getCurrentUser().catch(() => null));
        if (nextUser) {
          setUserState(nextUser);
          setRequiresOnboarding(
            records.requiresOnboarding ?? nextUser.onboardingCompleted === false,
          );
        }
        setStatus('authenticated');
        return true;
      } catch {
        clearAuthTokens();
        setUserState(null);
        setRequiresOnboarding(false);
        setStatus('unauthenticated');
        return false;
      }
    })();

    refreshInFlight.current = attempt;
    void attempt.then(() => {
      if (refreshInFlight.current === attempt) {
        refreshInFlight.current = null;
      }
    });
    return attempt;
  }, []);

  useEffect(() => {
    registerAuthRefreshHandler(refresh);
    return () => registerAuthRefreshHandler(null);
  }, [refresh]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const records = await restoreSessionOnce();
      if (!active) return;

      if (!records) {
        setUserState(null);
        setRequiresOnboarding(false);
        setStatus('unauthenticated');
        return;
      }

      const currentUser = await getCurrentUser().catch(() => records.user);
      if (!active) return;

      if (!currentUser) {
        clearAuthTokens();
        setUserState(null);
        setRequiresOnboarding(false);
        setStatus('unauthenticated');
        return;
      }

      setUserState(currentUser);
      setRequiresOnboarding(
        records.requiresOnboarding ?? currentUser.onboardingCompleted === false,
      );
      setStatus('authenticated');
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<SessionOutcome> => {
      const records = await loginRequest(payload);
      return applySession(records);
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<SessionOutcome> => {
      const records = await registerRequest(payload);
      return applySession(records);
    },
    [applySession],
  );

  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest();
    setUserState(null);
    setRequiresOnboarding(false);
    setStatus('unauthenticated');
  }, []);

  const setUser = useCallback((nextUser: AuthUser | null): void => {
    setUserState(nextUser);
    if (nextUser && typeof nextUser.onboardingCompleted === 'boolean') {
      setRequiresOnboarding(!nextUser.onboardingCompleted);
    }
  }, []);

  const completeOnboarding = useCallback(async (): Promise<'completed' | 'unavailable'> => {
    try {
      const updated = await completeOnboardingRequest();
      setUserState((previous) => {
        const base = updated ?? previous;
        return base ? { ...base, onboardingCompleted: true } : previous;
      });
      setRequiresOnboarding(false);
      return 'completed';
    } catch (error) {
      if (isNotFoundError(error)) {
        return 'unavailable';
      }
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      requiresOnboarding,
      login,
      register,
      logout,
      refresh,
      setUser,
      completeOnboarding,
    }),
    [status, user, requiresOnboarding, login, register, logout, refresh, setUser, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
