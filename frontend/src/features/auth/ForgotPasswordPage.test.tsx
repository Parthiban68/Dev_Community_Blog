import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderWithAuth } from '../../test/auth-utils';
import {
  forgotPassword,
  getCurrentUser,
  getGithubAuthStatus,
  refreshSession,
} from './auth.service';
import { clearAuthTokens } from './auth-store';
import { ForgotPasswordPage } from './ForgotPasswordPage';

vi.mock('./auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    clearAuthTokens();
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('No active session'));
    vi.mocked(getGithubAuthStatus).mockResolvedValue({ configured: false });
  });

  it('validates the email field', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it('shows a generic confirmation and honest local-development details', async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValue({
      deliveryConfigured: false,
      devResetUrl: 'http://localhost:3000/dev/reset?token=abc',
    });
    renderWithAuth(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    expect(
      await screen.findByText('If an account exists for that email, reset instructions will be provided.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Email delivery is not configured in this environment, so no email can be sent.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open local reset link' })).toHaveAttribute(
      'href',
      'http://localhost:3000/dev/reset?token=abc',
    );
  });

  it('does not show local-development details when delivery is configured', async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValue({ deliveryConfigured: true });
    renderWithAuth(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email address'), 'missing@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    expect(
      await screen.findByText('If an account exists for that email, reset instructions will be provided.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Email delivery is not configured/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open local reset link' })).not.toBeInTheDocument();
  });

  it('reports honestly when the endpoint is not available', async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockRejectedValue(apiError(404, 'Not found'));
    renderWithAuth(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    expect(
      await screen.findByText('Password reset is not available on this server yet. Please try again later.'),
    ).toBeInTheDocument();
  });
});
