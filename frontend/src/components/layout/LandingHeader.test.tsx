import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../features/auth/auth-context';
import { getCurrentUser, logout, refreshSession } from '../../features/auth/auth.service';
import { clearAuthTokens } from '../../features/auth/auth-store';
import type { SessionRecords } from '../../features/auth/auth.types';
import { mockUser, renderWithAuth, sessionRecords } from '../../test/auth-utils';
import { LandingHeader } from './LandingHeader';

vi.mock('../../features/auth/auth.service', async () => {
  const { createAuthServiceMock } = await import('../../test/auth-service-mock');
  return createAuthServiceMock();
});

function AuthControls() {
  const { logout: signOut, refresh } = useAuth();

  return (
    <>
      <button type="button" onClick={() => void signOut()}>
        Test logout
      </button>
      <button type="button" onClick={() => void refresh()}>
        Test refresh
      </button>
    </>
  );
}

function renderHeader() {
  return renderWithAuth(
    <>
      <LandingHeader />
      <AuthControls />
    </>,
  );
}

let resolvePendingRestore: ((records: SessionRecords) => void) | undefined;

describe('LandingHeader', () => {
  beforeEach(() => {
    clearAuthTokens();
    vi.clearAllMocks();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    vi.mocked(refreshSession).mockRejectedValue(new Error('No active session'));
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('No active session'));
    vi.mocked(logout).mockResolvedValue(undefined);
  });

  afterEach(() => {
    resolvePendingRestore?.(sessionRecords());
    resolvePendingRestore = undefined;
  });

  it('opens and closes the mobile navigation', async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close navigation' }));

    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('shows Sign in and Join free when logged out', async () => {
    renderHeader();

    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Join free' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('link', { name: /Access Community/i })).not.toBeInTheDocument();
  });

  it('shows Access Community when the session is authenticated', async () => {
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderHeader();

    expect(await screen.findByRole('link', { name: /Access Community/i })).toHaveAttribute(
      'href',
      '/app',
    );
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Join free' })).not.toBeInTheDocument();
  });

  it('does not show either logged-out action while the session is loading', () => {
    vi.mocked(refreshSession).mockImplementation(
      () =>
        new Promise<SessionRecords>((resolve) => {
          resolvePendingRestore = resolve;
        }),
    );
    renderHeader();

    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Join free' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Access Community/i })).not.toBeInTheDocument();
  });

  it('shows logged-out actions in the mobile menu when logged out', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    const menu = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(within(menu).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(within(menu).getByRole('link', { name: 'Join free' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('shows Access Community in the mobile menu when authenticated', async () => {
    const user = userEvent.setup();
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderHeader();

    expect(await screen.findByRole('link', { name: /Access Community/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    const menu = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(within(menu).getByRole('link', { name: /Access Community/i })).toHaveAttribute(
      'href',
      '/app',
    );
    expect(within(menu).queryByRole('link', { name: 'Join free' })).not.toBeInTheDocument();
  });

  it('returns to logged-out actions after logout', async () => {
    const user = userEvent.setup();
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderHeader();

    expect(await screen.findByRole('link', { name: /Access Community/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Test logout' }));

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Access Community/i })).not.toBeInTheDocument();
  });

  it('returns to logged-out actions when the session expires', async () => {
    const user = userEvent.setup();
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderHeader();

    expect(await screen.findByRole('link', { name: /Access Community/i })).toBeInTheDocument();
    vi.mocked(refreshSession).mockRejectedValue(new Error('Session expired'));

    await user.click(screen.getByRole('button', { name: 'Test refresh' }));

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Access Community/i })).not.toBeInTheDocument();
  });

  it('revalidates the session when another tab becomes active', async () => {
    vi.mocked(refreshSession).mockResolvedValue(sessionRecords());
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    renderHeader();

    expect(await screen.findByRole('link', { name: /Access Community/i })).toBeInTheDocument();
    vi.mocked(refreshSession).mockRejectedValue(new Error('Session expired in another tab'));

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
