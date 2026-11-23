import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '../../components/common/BrandMark';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuth } from './auth-context';
import type { VerificationNotice } from './auth.types';
import { VerificationBanner } from './components/VerificationBanner';

export function AuthenticatedHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);

  const verification = (location.state as { verification?: VerificationNotice } | null)
    ?.verification;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2.5" aria-label="devcommons home">
          <BrandMark className="border border-auth-border" />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">devcommons</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle className="auth-theme-toggle" />
          <Button
            variant="secondary"
            className="btn-auth-secondary"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">
          Welcome, {user?.displayName ?? user?.username ?? 'developer'}
        </h1>
        <p className="auth-muted mt-3 text-sm leading-6">
          This is your authenticated home placeholder. Communities, projects and events arrive in
          Phase 03.
        </p>
        {verification ? (
          <div className="mt-6">
            <VerificationBanner notice={verification} />
          </div>
        ) : null}
        <dl className="auth-card mt-8 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="auth-muted">Username</dt>
            <dd className="font-medium">{user?.username}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="auth-muted">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="auth-muted">Email verified</dt>
            <dd className="font-medium">{user?.emailVerified ? 'Verified' : 'Not verified'}</dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
