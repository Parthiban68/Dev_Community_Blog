import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './auth-context';
import { getAuthErrorMessage } from './auth.errors';
import { checkEmail, checkUsername } from './auth.service';
import type { VerificationNotice } from './auth.types';
import { AuthMessage } from './components/AuthMessage';
import { GitHubButton } from './components/GitHubButton';
import { PasswordField } from './components/PasswordField';
import { PasswordStrengthMeter } from './components/PasswordStrengthMeter';
import {
  registerFields,
  registerSchema,
  suggestUsernameFromEmail,
  type RegisterFormValues,
} from './validation';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface AvailabilityState {
  status: AvailabilityStatus;
  message?: string;
}

const idleAvailability: AvailabilityState = { status: 'idle' };

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>(idleAvailability);
  const [emailAvailability, setEmailAvailability] = useState<AvailabilityState>(idleAvailability);
  const usernameRequestId = useRef(0);
  const emailRequestId = useRef(0);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { username: '', email: '', displayName: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');
  const emailValue = watch('email');
  const usernameValue = watch('username');
  const suggestion = suggestUsernameFromEmail(emailValue);

  async function runAvailabilityCheck(field: 'username' | 'email') {
    const fieldSchema =
      field === 'username' ? registerFields.shape.username : registerFields.shape.email;
    const parsed = fieldSchema.safeParse(getValues(field));
    if (!parsed.success) {
      return;
    }
    const value = parsed.data;

    const requestId =
      field === 'username' ? ++usernameRequestId.current : ++emailRequestId.current;
    const setState = field === 'username' ? setUsernameAvailability : setEmailAvailability;
    setState({ status: 'checking', message: `Checking ${field} availability…` });

    try {
      const available =
        field === 'username' ? await checkUsername(value) : await checkEmail(value);
      const currentId = field === 'username' ? usernameRequestId.current : emailRequestId.current;
      if (requestId !== currentId) {
        return;
      }

      if (available) {
        setState({
          status: 'available',
          message: field === 'username' ? 'Username is available.' : 'Email address is available.',
        });
      } else {
        setState({
          status: 'taken',
          message:
            field === 'username'
              ? 'Username is already taken.'
              : 'An account with this email already exists.',
        });
      }
    } catch {
      const currentId = field === 'username' ? usernameRequestId.current : emailRequestId.current;
      if (requestId !== currentId) {
        return;
      }
      setState({
        status: 'error',
        message: `Could not check ${field} availability right now.`,
      });
    }
  }

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    if (usernameAvailability.status === 'taken' || emailAvailability.status === 'taken') {
      setFormError('Choose an available username and email address before continuing.');
      return;
    }
    try {
      const outcome = await registerAccount({
        username: values.username,
        email: values.email,
        displayName: values.displayName,
        password: values.password,
      });
      const verification: VerificationNotice = {
        required: outcome.emailVerificationRequired,
        deliveryConfigured: outcome.deliveryConfigured,
      };
      navigate(outcome.requiresOnboarding ? '/onboarding' : '/app', {
        replace: true,
        state: { verification },
      });
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'Unable to create your account. Check the fields and try again.'),
      );
    }
  }

  const usernameField = register('username');
  const emailField = register('email');

  return (
    <AuthLayout
      wide
      title="Join devcommons"
      description="Create your account to connect with developers around the world."
      footer={
        <p className="auth-muted">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor="register-username" className="auth-label">
              Username
            </label>
            <input
              id="register-username"
              type="text"
              autoComplete="username"
              className="auth-input"
              aria-invalid={errors.username || usernameAvailability.status === 'taken' ? true : undefined}
              aria-describedby={
                errors.username
                  ? 'register-username-error'
                  : usernameAvailability.status === 'taken'
                    ? 'register-username-availability'
                    : undefined
              }
              {...usernameField}
              onChange={(event) => {
                void usernameField.onChange(event);
                setUsernameAvailability(idleAvailability);
              }}
              onBlur={(event) => {
                void usernameField.onBlur(event);
                void runAvailabilityCheck('username');
              }}
            />
            {errors.username ? (
              <p
                id="register-username-error"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {errors.username.message}
              </p>
            ) : usernameAvailability.status === 'taken' ? (
              <p
                id="register-username-availability"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {usernameAvailability.message}
              </p>
            ) : usernameAvailability.status !== 'idle' ? (
              <p
                role="status"
                className={`mt-1.5 text-xs leading-5 ${usernameAvailability.status === 'available' ? 'auth-success-text' : 'auth-muted'}`}
              >
                {usernameAvailability.message}
              </p>
            ) : null}
            {suggestion && !usernameValue ? (
              <button
                type="button"
                className="auth-link mt-1.5 text-xs"
                onClick={() => {
                  setValue('username', suggestion, { shouldValidate: true });
                  void runAvailabilityCheck('username');
                }}
              >
                Use suggestion: {suggestion}
              </button>
            ) : null}
          </div>
          <div>
            <label htmlFor="register-email" className="auth-label">
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              className="auth-input"
              aria-invalid={errors.email || emailAvailability.status === 'taken' ? true : undefined}
              aria-describedby={
                errors.email
                  ? 'register-email-error'
                  : emailAvailability.status === 'taken'
                    ? 'register-email-availability'
                    : undefined
              }
              {...emailField}
              onChange={(event) => {
                void emailField.onChange(event);
                setEmailAvailability(idleAvailability);
              }}
              onBlur={(event) => {
                void emailField.onBlur(event);
                void runAvailabilityCheck('email');
              }}
            />
            {errors.email ? (
              <p
                id="register-email-error"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {errors.email.message}
              </p>
            ) : emailAvailability.status === 'taken' ? (
              <p
                id="register-email-availability"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {emailAvailability.message}
              </p>
            ) : emailAvailability.status !== 'idle' ? (
              <p
                role="status"
                className={`mt-1.5 text-xs leading-5 ${emailAvailability.status === 'available' ? 'auth-success-text' : 'auth-muted'}`}
              >
                {emailAvailability.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="register-display-name" className="auth-label">
              Display name
            </label>
            <input
              id="register-display-name"
              type="text"
              autoComplete="name"
              className="auth-input"
              aria-invalid={errors.displayName ? true : undefined}
              aria-describedby={errors.displayName ? 'register-display-name-error' : undefined}
              {...register('displayName')}
            />
            {errors.displayName ? (
              <p
                id="register-display-name-error"
                role="alert"
                className="auth-error-text mt-1.5 text-xs leading-5"
              >
                {errors.displayName.message}
              </p>
            ) : null}
          </div>
          <div>
            <PasswordField
              label="Password"
              registration={register('password')}
              error={errors.password?.message}
              autoComplete="new-password"
              describedBy="register-password-strength"
            />
            <div id="register-password-strength">
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
        <span className="auth-muted text-xs uppercase tracking-[0.14em]">or</span>
        <span className="h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
      </div>
      <GitHubButton />
    </AuthLayout>
  );
}
