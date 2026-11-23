import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { getAuthErrorMessage, getErrorStatus } from './auth.errors';
import { resetPassword } from './auth.service';
import { AuthMessage } from './components/AuthMessage';
import { PasswordField } from './components/PasswordField';
import { PasswordStrengthMeter } from './components/PasswordStrengthMeter';
import { resetPasswordSchema, type ResetPasswordFormValues } from './validation';

const invalidLinkStatuses = new Set([400, 401, 403, 410]);

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    try {
      await resetPassword({ token, password: values.password });
      setSuccess(true);
    } catch (error) {
      const status = getErrorStatus(error);
      if (status !== undefined && invalidLinkStatuses.has(status)) {
        setLinkInvalid(true);
        setFormError(
          getAuthErrorMessage(error, 'This reset link is invalid or has expired. Request a new one.'),
        );
        return;
      }
      setFormError(
        getAuthErrorMessage(error, 'Unable to update your password right now. Try again later.'),
      );
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      description="Pick a strong password you have not used before."
      footer={
        <Link to="/login" className="auth-link">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <div className="space-y-4">
          <AuthMessage tone="error">
            This reset link is missing a token. Request a new link to continue.
          </AuthMessage>
          <p className="text-sm">
            <Link to="/forgot-password" className="auth-link">
              Request a new link
            </Link>
          </p>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <AuthMessage tone="success">
            Your password has been updated. Sign in with your new password.
          </AuthMessage>
          <p className="text-sm">
            <Link to="/login" className="auth-link">
              Go to sign in
            </Link>
          </p>
        </div>
      ) : linkInvalid ? (
        <div className="space-y-4">
          <AuthMessage tone="error">{formError}</AuthMessage>
          <p className="text-sm">
            <Link to="/forgot-password" className="auth-link">
              Request a new link
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <div>
              <PasswordField
                label="Password"
                registration={register('password')}
                error={errors.password?.message}
                autoComplete="new-password"
                describedBy="reset-password-strength"
              />
              <div id="reset-password-strength">
                <PasswordStrengthMeter password={passwordValue} />
              </div>
            </div>
            <PasswordField
              label="Confirm password"
              registration={register('confirmPassword')}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>
          {formError ? (
            <div className="mt-4">
              <AuthMessage tone="error">{formError}</AuthMessage>
            </div>
          ) : null}
          <Button type="submit" className="btn-auth-primary mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
