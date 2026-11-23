import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { getAuthErrorMessage, isNotFoundError } from './auth.errors';
import { forgotPassword } from './auth.service';
import type { ForgotPasswordResult } from './auth.types';
import { AuthMessage } from './components/AuthMessage';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from './validation';

export function ForgotPasswordPage() {
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      const records = await forgotPassword(values.email);
      setResult(records);
    } catch (error) {
      if (isNotFoundError(error)) {
        setUnavailable(true);
        return;
      }
      setFormError(
        getAuthErrorMessage(error, 'Unable to request reset instructions right now. Try again later.'),
      );
    }
  }

  const backToSignIn = (
    <Link to="/login" className="auth-link">
      Back to sign in
    </Link>
  );

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we will provide instructions if an account exists."
      footer={backToSignIn}
    >
      {result ? (
        <div className="space-y-4">
          <AuthMessage tone="success">
            If an account exists for that email, reset instructions will be provided.
          </AuthMessage>
          {result.deliveryConfigured === false ? (
            <AuthMessage tone="info">
              Email delivery is not configured in this environment, so no email can be sent.
            </AuthMessage>
          ) : null}
          {result.devResetUrl ? (
            <p className="text-sm">
              <a href={result.devResetUrl} className="auth-link">
                Open local reset link
              </a>
            </p>
          ) : null}
        </div>
      ) : unavailable ? (
        <AuthMessage tone="info">
          Password reset is not available on this server yet. Please try again later.
        </AuthMessage>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="forgot-email" className="auth-label">
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              className="auth-input"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'forgot-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p
                id="forgot-email-error"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {errors.email.message}
              </p>
            ) : null}
          </div>
          {formError ? (
            <div className="mt-4">
              <AuthMessage tone="error">{formError}</AuthMessage>
            </div>
          ) : null}
          <Button type="submit" className="btn-auth-primary mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset instructions'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
