import { User, UserStatus } from '../../modules/auth/entities/user.entity';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    createdAt: user.createdAt.toISOString(),
  };
}
