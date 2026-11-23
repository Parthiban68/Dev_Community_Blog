import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { apiError, renderWithAuth, sessionRecords } from '../../test/auth-utils';
import { AuthenticatedHomePage } from './AuthenticatedHomePage';
import {
  checkEmail,
  checkUsername,
  getCurrentUser,
  getGithubAuthStatus,
  refreshSession,
  register,
} from './auth.service';
import { clearAuthTokens } from './auth-store';
import { RegisterPage } from './RegisterPage';

vi.mock('./auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Username'), 'ada');
  await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
  await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Password'), 'Abcdefgh1!xy');
  await user.type(screen.getByLabelText('Confirm password'), 'Abcdefgh1!xy');
}

describe('RegisterPage', () => {
  beforeEach(() => {
    clearAuthTokens();
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('No active session'));
    vi.mocked(getGithubAuthStatus).mockResolvedValue({ configured: false });
    vi.mocked(checkUsername).mockResolvedValue(true);
    vi.mocked(checkEmail).mockResolvedValue(true);
  });

  it('renders the editorial registration composition', () => {
    renderWithAuth(<RegisterPage />);

    expect(
      screen.getByRole('heading', { name: 'Your next chapter starts here.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('ONE COMMUNITY. MANY POSSIBILITIES.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create your account.' })).toBeInTheDocument();
    expect(screen.getByText('CONNECT.')).toBeInTheDocument();
    expect(screen.getByText('CREATE.')).toBeInTheDocument();
    expect(screen.getByText('COLLABORATE.')).toBeInTheDocument();
  });

  it('shows a loading indicator while creating the account', async () => {
    const user = userEvent.setup();
    let resolveRegister: ((value: ReturnType<typeof sessionRecords>) => void) | undefined;
    vi.mocked(register).mockImplementation(
      () =>
        new Promise<ReturnType<typeof sessionRecords>>((resolve) => {
          resolveRegister = resolve;
        }),
    );
    renderWithAuth(<RegisterPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('button', { name: /Creating account/i })).toBeDisabled();
    resolveRegister?.(sessionRecords());
  });

  it('shows the backend message when registration fails', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockRejectedValue(apiError(409, 'Username is already taken.'));
    renderWithAuth(<RegisterPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Username is already taken.')).toBeInTheDocument();
  });

  it('rejects a password that is too short', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);

    await user.type(screen.getByLabelText('Username'), 'ada');
    await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
    await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('rejects mismatched password confirmation', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);

    await user.type(screen.getByLabelText('Username'), 'ada');
    await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
    await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Password'), 'Abcdefgh1!xy');
    await user.type(screen.getByLabelText('Confirm password'), 'Abcdefgh1!xz');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('updates the password strength meter while typing', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'abc');
    expect(screen.getByText('Password strength: Too weak')).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'Abcdefgh1');
    expect(screen.getByText('Password strength: Fair')).toBeInTheDocument();
  });

  it('blocks submission when the username is already taken', async () => {
    const user = userEvent.setup();
    vi.mocked(checkUsername).mockResolvedValue(false);
    renderWithAuth(<RegisterPage />);

    await user.type(screen.getByLabelText('Username'), 'ada');
    await user.click(screen.getByLabelText('Email address'));

    expect(await screen.findByText('Username is already taken.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
    await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Password'), 'Abcdefgh1!xy');
    await user.type(screen.getByLabelText('Confirm password'), 'Abcdefgh1!xy');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('Choose an available username and email address before continuing.'),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('shows availability confirmation when the username is free', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);

    await user.type(screen.getByLabelText('Username'), 'ada');
    await user.click(screen.getByLabelText('Email address'));

    expect(await screen.findByText('Username is available.')).toBeInTheDocument();
    expect(checkUsername).toHaveBeenCalledWith('ada');
  });

  it('redirects to /app and honestly reports unconfigured email delivery', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValue(
      sessionRecords({ emailVerificationRequired: true, deliveryConfigured: false }),
    );
    renderWithAuth(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app" element={<AuthenticatedHomePage />} />
      </Routes>,
      ['/register'],
    );

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Welcome, Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/no email was sent/i)).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({
      username: 'ada',
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      password: 'Abcdefgh1!xy',
    });
  });
});
