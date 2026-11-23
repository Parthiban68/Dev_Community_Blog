export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  email_verified?: boolean;
  onboarding_completed?: boolean;
}

export interface SessionRecords {
  accessToken: string;
  csrfToken?: string | null;
  user: AuthUser;
  requiresOnboarding?: boolean;
  verificationRequired?: boolean;
  emailVerified?: boolean;
  emailVerificationRequired?: boolean;
  deliveryConfigured?: boolean;
}

export interface SessionOutcome {
  requiresOnboarding: boolean;
  emailVerificationRequired: boolean;
  deliveryConfigured: boolean;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export interface ForgotPasswordResult {
  message?: string;
  deliveryConfigured?: boolean;
  devResetUrl?: string | null;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AvailabilityRecords {
  available: boolean;
}

export interface GithubAuthStatus {
  configured: boolean;
}

export interface VerificationNotice {
  required: boolean;
  deliveryConfigured: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
