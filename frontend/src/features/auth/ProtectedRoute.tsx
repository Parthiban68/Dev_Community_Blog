import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const { status, requiresOnboarding } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="auth-shell flex min-h-screen flex-col items-center justify-center gap-4 px-6"
      >
        <div className="auth-card max-w-md animate-pulse" aria-hidden="true">
          <div className="h-4 w-2/3" style={{ backgroundColor: 'var(--auth-border)' }} />
          <div className="mt-3 h-3 w-full" style={{ backgroundColor: 'var(--auth-border)' }} />
          <div className="mt-2 h-3 w-5/6" style={{ backgroundColor: 'var(--auth-border)' }} />
        </div>
        <p className="auth-muted text-sm">Restoring your session…</p>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (requiresOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requiresOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
