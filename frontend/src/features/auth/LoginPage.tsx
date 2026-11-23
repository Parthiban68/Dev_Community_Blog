import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './auth-context';
import { getAuthErrorMessage } from './auth.errors';
import { AuthMessage } from './components/AuthMessage';
import { GitHubButton } from './components/GitHubButton';
import { PasswordField } from './components/PasswordField';
import { loginSchema, type LoginFormValues } from './validation';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const outcome = await login({
        identifier: values.identifier,
        password: values.password,
        rememberMe: values.rememberMe,
      });
      navigate(outcome.requiresOnboarding ? '/onboarding' : from, { replace: true });
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'Unable to sign in. Check your credentials and try again.'),
      );
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue to devcommons."
      footer={
        <p className="auth-muted">
          New to devcommons?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor="login-identifier" className="auth-label">
              Email or username
            </label>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              className="auth-input"
              aria-invalid={errors.identifier ? true : undefined}
              aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
              {...register('identifier')}
            />
            {errors.identifier ? (
              <p
                id="login-identifier-error"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {errors.identifier.message}
              </p>
            ) : null}
          </div>
          <PasswordField
            label="Password"
            registration={register('password')}
            error={errors.password?.message}
            autoComplete="current-password"
          />
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                style={{ accentColor: 'var(--auth-accent)' }}
                {...register('rememberMe')}
              />
              Remember me
            </label>
            <p className="auth-muted mt-1 text-xs leading-5">
              Access tokens stay in memory only, so you may need to sign in again after closing the
              tab.
            </p>
          </div>
        </div>
        {formError ? (
          <div className="mt-4">
            <AuthMessage tone="error">{formError}</AuthMessage>
          </div>
        ) : null}
        <Button type="submit" className="btn-auth-primary mt-5 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-4 flex justify-center text-sm">
        <Link to="/forgot-password" className="auth-link">
          Forgot your password?
        </Link>
      </div>
      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
        <span className="auth-muted text-xs uppercase tracking-[0.14em]">or</span>
        <span className="h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
      </div>
      <GitHubButton />
    </AuthLayout>
  );
}
