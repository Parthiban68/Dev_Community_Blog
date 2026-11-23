import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './auth-context';
import { getAuthErrorMessage } from './auth.errors';
import type { VerificationNotice } from './auth.types';
import { AuthMessage } from './components/AuthMessage';
import { VerificationBanner } from './components/VerificationBanner';

export function OnboardingPage() {
  const { user, completeOnboarding, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<'idle' | 'submitting' | 'unavailable'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const verification = (location.state as { verification?: VerificationNotice } | null)
    ?.verification;

  async function handleComplete() {
    setFormError(null);
    setState('submitting');
    try {
      const outcome = await completeOnboarding();
      if (outcome === 'unavailable') {
        setState('unavailable');
        return;
      }
      navigate('/app', { replace: true });
    } catch (error) {
      setState('idle');
      setFormError(getAuthErrorMessage(error, 'Could not complete onboarding right now. Try again.'));
    }
  }

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
    <AuthLayout
      title="Welcome to devcommons"
      description="Complete onboarding to unlock your workspace."
    >
      <div className="space-y-4">
        <p className="text-sm leading-6">
          Signed in as <span className="font-medium">{user?.displayName ?? user?.username}</span>.
          Onboarding preferences will be expanded in a later phase.
        </p>
        <VerificationBanner notice={verification} />
        {state === 'unavailable' ? (
          <AuthMessage tone="info">
            Onboarding completion is not available on this server yet. You can sign out and try
            again later.
          </AuthMessage>
        ) : null}
        {formError ? <AuthMessage tone="error">{formError}</AuthMessage> : null}
        <Button
          className="btn-auth-primary w-full"
          onClick={handleComplete}
          disabled={state !== 'idle'}
        >
          {state === 'submitting' ? 'Completing…' : 'Complete onboarding'}
        </Button>
        <Button
          variant="quiet"
          className="auth-theme-toggle w-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </AuthLayout>
  );
}
