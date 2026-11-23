import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { getAuthErrorMessage } from './auth.errors';
import { AuthMessage } from './components/AuthMessage';
import { AuthSubmitButton } from './components/AuthSubmitButton';
import { AuthEditorialLayout } from './components/AuthEditorialLayout';
import { AuthTextField } from './components/AuthTextField';
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
    <AuthEditorialLayout
      variant="login"
      title="Welcome back."
      description="Sign in to continue your journey with devcommons."
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
        <div className="space-y-5">
          <AuthTextField
            id="login-identifier"
            label="Email address"
            type="text"
            autoComplete="username"
            error={errors.identifier?.message}
            hint={<p className="auth-muted mt-1 text-[11px] leading-4">You can also use your username.</p>}
            {...register('identifier')}
          />
          <PasswordField
            label="Password"
            registration={register('password')}
            error={errors.password?.message}
            autoComplete="current-password"
          />
          <div>
            <div className="auth-field-row">
              <label className="auth-checkbox">
                <input type="checkbox" {...register('rememberMe')} />
                Remember me
              </label>
              <Link to="/forgot-password" className="auth-link text-xs">
                Forgot password?
              </Link>
            </div>
            <p className="auth-muted mt-2 text-[11px] leading-5">
              Access tokens stay in memory only, so you may need to sign in again after closing the
              tab.
            </p>
          </div>
        </div>
        {formError ? (
          <div className="mt-5">
            <AuthMessage tone="error">{formError}</AuthMessage>
          </div>
        ) : null}
        <AuthSubmitButton loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </AuthSubmitButton>
      </form>
      <div className="auth-divider" aria-hidden="true">
        <span className="h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
        <span className="auth-muted text-[10px] uppercase tracking-[0.18em]">or</span>
        <span className="h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
      </div>
      <GitHubButton />
    </AuthEditorialLayout>
  );
}
