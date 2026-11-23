import { SafeUser } from '../../common/types/safe-user';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

export interface AuthSessionResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  requiresOnboarding: boolean;
  verificationRequired: boolean;
  emailVerified: boolean;
}

export interface ForgotPasswordResult {
  message: string;
  devResetUrl?: string;
}

export interface ResetPasswordResult {
  reset: boolean;
}

export interface LogoutResult {
  loggedOut: boolean;
}

export interface AvailabilityResult {
  available: boolean;
}

export interface GithubProfile {
  id: string;
  login: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
}
