import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { mockUser, renderWithAuth, sessionRecords } from '../../test/auth-utils';
import { getCurrentUser, getGithubAuthStatus, refreshSession } from './auth.service';
import { clearAuthTokens } from './auth-store';
import type { SessionRecords } from './auth.types';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('./auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

function LoginMarker() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '';
  return <div>Login page {from}</div>;
}

function renderProtected(initialEntries: string[] = ['/app']) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<LoginMarker />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<div>App content</div>} />
        <Route path="/onboarding" element={<div>Onboarding page</div>} />
      </Route>
    </Routes>,
    initialEntries,
  );
}

let resolvePendingRestore: ((records: SessionRecords) => void) | undefined;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    clearAuthTokens();
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('No active session'));
    vi.mocked(getGithubAuthStatus).mockResolvedValue({ configured: false });
  });

  afterEach(() => {
    resolvePendingRestore?.(sessionRecords());
    resolvePendingRestore = undefined;
  });

  it('redirects unauthenticated users to /login with state.from', async () => {
    renderProtected(['/app']);

    expect(await screen.findByText('Login page /app')).toBeInTheDocument();
    expect(screen.queryByText('App content')).not.toBeInTheDocument();
  });

  it('renders protected content for an authenticated user', async () => {
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderProtected();

    expect(await screen.findByText('App content')).toBeInTheDocument();
  });

  it('redirects users with incomplete onboarding to /onboarding', async () => {
    const onboardingUser = { ...mockUser, onboardingCompleted: false };
    vi.mocked(refreshSession).mockResolvedValue(
      sessionRecords({ requiresOnboarding: true, user: onboardingUser }),
    );
    vi.mocked(getCurrentUser).mockResolvedValue(onboardingUser);
    renderProtected();

    expect(await screen.findByText('Onboarding page')).toBeInTheDocument();
  });

  it('redirects users who finished onboarding away from /onboarding', async () => {
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderProtected(['/onboarding']);

    expect(await screen.findByText('App content')).toBeInTheDocument();
  });

  it('shows a loading skeleton while the session is being restored', () => {
    vi.mocked(refreshSession).mockImplementation(
      () =>
        new Promise<SessionRecords>((resolve) => {
          resolvePendingRestore = resolve;
        }),
    );
    renderProtected();

    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session…');
    expect(screen.queryByText('App content')).not.toBeInTheDocument();
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
  });
});
