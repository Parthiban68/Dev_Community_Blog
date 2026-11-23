import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { apiError, renderWithAuth, sessionRecords } from '../../test/auth-utils';
import { getGithubAuthStatus, getCurrentUser, login, refreshSession } from './auth.service';
import { clearAuthTokens } from './auth-store';
import { LoginPage } from './LoginPage';

vi.mock('./auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

function renderLoginRoutes(initialEntries: Parameters<typeof renderWithAuth>[1] = ['/login']) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<div>Authenticated home</div>} />
      <Route path="/onboarding" element={<div>Onboarding shell</div>} />
      <Route path="/projects" element={<div>Projects placeholder</div>} />
    </Routes>,
    initialEntries,
  );
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email or username'), 'ada');
  await user.type(screen.getByLabelText('Password'), 'Abcdefgh1');
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearAuthTokens();
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('No active session'));
    vi.mocked(getGithubAuthStatus).mockResolvedValue({ configured: false });
  });

  it('shows field validation errors and does not call the API for an empty form', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your email or username.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.type(passwordInput, 'Abcdefgh1');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows the backend message for invalid credentials', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockRejectedValue(apiError(401, 'Invalid email/username or password.'));
    renderWithAuth(<LoginPage />);

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email/username or password.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('redirects to /app after a successful sign in', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue(sessionRecords());
    renderLoginRoutes();

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Authenticated home')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({
      identifier: 'ada',
      password: 'Abcdefgh1',
      rememberMe: false,
    });
  });

  it('redirects to /onboarding when the backend requires onboarding', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue(sessionRecords({ requiresOnboarding: true }));
    renderLoginRoutes();

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Onboarding shell')).toBeInTheDocument();
  });

  it('redirects to location.state.from when present', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue(sessionRecords());
    renderLoginRoutes([{ pathname: '/login', state: { from: '/projects' } }]);

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Projects placeholder')).toBeInTheDocument();
  });

  it('shows an honest message when GitHub sign-in is not configured', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);

    const githubButton = screen.getByRole('button', { name: /Continue with GitHub/i });
    await waitFor(() => expect(githubButton).toBeEnabled());
    await user.click(githubButton);

    expect(
      await screen.findByText(/GitHub sign-in is not configured on this server yet/i),
    ).toBeInTheDocument();
  });
});
