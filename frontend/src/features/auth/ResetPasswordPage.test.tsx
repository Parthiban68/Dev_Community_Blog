import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderWithAuth } from '../../test/auth-utils';
import { getCurrentUser, getGithubAuthStatus, refreshSession, resetPassword } from './auth.service';
import { clearAuthTokens } from './auth-store';
import { ResetPasswordPage } from './ResetPasswordPage';

vi.mock('./auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    clearAuthTokens();
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('No active session'));
    vi.mocked(getGithubAuthStatus).mockResolvedValue({ configured: false });
  });

  it('shows an error when the token is missing', async () => {
    renderWithAuth(<ResetPasswordPage />, ['/reset-password']);

    expect(
      await screen.findByText('This reset link is missing a token. Request a new link to continue.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update password' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('submits the token and new password, then links to sign in', async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockResolvedValue(undefined);
    renderWithAuth(<ResetPasswordPage />, ['/reset-password?token=reset-token']);

    await user.type(screen.getByLabelText('Password'), 'Abcdefgh1!xy');
    await user.type(screen.getByLabelText('Confirm password'), 'Abcdefgh1!xy');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      await screen.findByText('Your password has been updated. Sign in with your new password.'),
    ).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith({ token: 'reset-token', password: 'Abcdefgh1!xy' });
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/login');
  });

  it('handles an expired or invalid token from the backend', async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockRejectedValue(apiError(400, 'Reset token expired.'));
    renderWithAuth(<ResetPasswordPage />, ['/reset-password?token=expired']);

    await user.type(screen.getByLabelText('Password'), 'Abcdefgh1!xy');
    await user.type(screen.getByLabelText('Confirm password'), 'Abcdefgh1!xy');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Reset token expired.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});
