import { apiBaseUrl, apiClient } from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';
import { isNotFoundError } from './auth.errors';
import { clearAuthTokens, setAccessToken, setCsrfToken } from './auth-store';
import type {
  AuthUser,
  AvailabilityRecords,
  ForgotPasswordResult,
  GithubAuthStatus,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SessionRecords,
} from './auth.types';

function normalizeUser(raw: AuthUser): AuthUser {
  return {
    ...raw,
    emailVerified: raw.emailVerified ?? raw.email_verified,
    onboardingCompleted: raw.onboardingCompleted ?? raw.onboarding_completed,
  };
}

function normalizeSession(records: SessionRecords): SessionRecords {
  const user = normalizeUser(records.user);
  return {
    ...records,
    user,
    requiresOnboarding: records.requiresOnboarding ?? user.onboardingCompleted === false,
    emailVerificationRequired:
      records.emailVerificationRequired ?? records.verificationRequired ?? user.emailVerified === false,
  };
}

function storeSessionTokens(records: SessionRecords): SessionRecords {
  const normalized = normalizeSession(records);
  setAccessToken(normalized.accessToken);
  setCsrfToken(normalized.csrfToken ?? null);
  return normalized;
}

function unwrapUser(records: AuthUser | { user: AuthUser }): AuthUser {
  return normalizeUser('user' in records ? records.user : records);
}

export async function login({ identifier, password }: LoginPayload): Promise<SessionRecords> {
  const response = await apiClient.post<ApiEnvelope<SessionRecords>>('/auth/login', {
    identifier,
    password,
  });
  return storeSessionTokens(response.data.records);
}

export async function register(payload: RegisterPayload): Promise<SessionRecords> {
  const response = await apiClient.post<ApiEnvelope<SessionRecords>>('/auth/register', payload);
  return storeSessionTokens(response.data.records);
}

export async function refreshSession(): Promise<SessionRecords> {
  const response = await apiClient.post<ApiEnvelope<SessionRecords>>('/auth/refresh', {});
  return storeSessionTokens(response.data.records);
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout').catch(() => undefined);
  clearAuthTokens();
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const response = await apiClient.post<ApiEnvelope<ForgotPasswordResult | null>>(
    '/auth/forgot-password',
    { email },
  );
  const records = response.data.records ?? {};
  return {
    ...records,
    deliveryConfigured: records.deliveryConfigured ?? (records.devResetUrl ? false : undefined),
    devResetUrl: records.devResetUrl ?? null,
  };
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/auth/reset-password', payload);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiEnvelope<AuthUser | { user: AuthUser }>>('/users/me');
  return unwrapUser(response.data.records);
}

export async function checkUsername(username: string): Promise<boolean> {
  const response = await apiClient.get<ApiEnvelope<AvailabilityRecords>>('/auth/check-username', {
    params: { username },
  });
  return Boolean(response.data.records?.available);
}

export async function checkEmail(email: string): Promise<boolean> {
  const response = await apiClient.get<ApiEnvelope<AvailabilityRecords>>('/auth/check-email', {
    params: { email },
  });
  return Boolean(response.data.records?.available);
}

export async function getGithubAuthStatus(): Promise<GithubAuthStatus> {
  try {
    const response = await apiClient.get<ApiEnvelope<GithubAuthStatus>>('/auth/github/status');
    return { configured: Boolean(response.data.records?.configured) };
  } catch (error) {
    if (!isNotFoundError(error)) {
      return { configured: false };
    }
  }

  try {
    const response = await fetch(getGithubLoginUrl(), {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual',
    });
    return { configured: response.type === 'opaqueredirect' };
  } catch {
    return { configured: false };
  }
}

export function getGithubLoginUrl(): string {
  return `${apiBaseUrl}/auth/github`;
}

export async function completeOnboarding(): Promise<AuthUser | null> {
  const response = await apiClient.post<ApiEnvelope<AuthUser | { user: AuthUser } | null>>(
    '/users/onboarding/complete',
  );
  const records = response.data.records;
  return records ? unwrapUser(records) : null;
}
