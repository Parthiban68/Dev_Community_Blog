import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { getAuthErrorMessage } from './auth.errors';
import { checkEmail, checkUsername } from './auth.service';
import type { VerificationNotice } from './auth.types';
import { AuthMessage } from './components/AuthMessage';
import { AuthSubmitButton } from './components/AuthSubmitButton';
import { AuthEditorialLayout } from './components/AuthEditorialLayout';
import { AuthTextField } from './components/AuthTextField';
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

  function availabilityHint(state: AvailabilityState) {
    if (state.status === 'idle' || state.status === 'taken') {
      return null;
    }

    return (
      <p
        role="status"
        className={state.status === 'error' ? 'auth-field-error' : 'auth-success-text'}
      >
        {state.message}
      </p>
    );
  }

  return (
    <AuthEditorialLayout
      variant="register"
      title="Create your account."
      description="Join a global community of people who build and share."
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
        <div className="space-y-5">
          <AuthTextField
            id="register-username"
            label="Username"
            type="text"
            autoComplete="username"
            error={
              errors.username?.message ??
              (usernameAvailability.status === 'taken' ? usernameAvailability.message : undefined)
            }
            hint={
              <div className="space-y-1">
                {availabilityHint(usernameAvailability)}
                {suggestion && !usernameValue ? (
                  <button
                    type="button"
                    className="auth-link text-xs"
                    onClick={() => {
                      setValue('username', suggestion, { shouldValidate: true });
                      void runAvailabilityCheck('username');
                    }}
                  >
                    Use suggestion: {suggestion}
                  </button>
                ) : null}
              </div>
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
          <AuthTextField
            id="register-email"
            label="Email address"
            type="email"
            autoComplete="email"
            error={
              errors.email?.message ??
              (emailAvailability.status === 'taken' ? emailAvailability.message : undefined)
            }
            hint={availabilityHint(emailAvailability)}
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
          <AuthTextField
            id="register-display-name"
            label="Display name"
            type="text"
            autoComplete="name"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <div className="auth-field">
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
          <div className="mt-5">
            <AuthMessage tone="error">{formError}</AuthMessage>
          </div>
        ) : null}
        <AuthSubmitButton loading={isSubmitting} loadingText="Creating account…">
          Create account
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
