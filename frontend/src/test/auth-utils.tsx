import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, type InitialEntry } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import type { AuthUser, SessionRecords } from '../features/auth/auth.types';

export const mockUser: AuthUser = {
  id: 'user-1',
  username: 'ada',
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  emailVerified: true,
  onboardingCompleted: true,
};

export function sessionRecords(overrides: Partial<SessionRecords> = {}): SessionRecords {
  return {
    accessToken: 'access-token',
    csrfToken: 'csrf-token',
    user: mockUser,
    requiresOnboarding: false,
    emailVerificationRequired: false,
    deliveryConfigured: false,
    ...overrides,
  };
}

export function apiError(status: number, message: string): Error {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  });
}

export function renderWithAuth(ui: ReactElement, initialEntries: InitialEntry[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
