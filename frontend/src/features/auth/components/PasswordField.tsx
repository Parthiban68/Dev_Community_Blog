import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface PasswordFieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
  describedBy?: string;
}

export function PasswordField({
  label,
  registration,
  error,
  autoComplete = 'current-password',
  describedBy,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const descriptionIds =
    [describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="auth-input pr-11"
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionIds}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="auth-muted absolute inset-y-0 right-0 flex w-11 items-center justify-center"
        >
          {visible ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="auth-error-text mt-1.5 text-xs leading-5">
          {error}
        </p>
      ) : null}
    </div>
  );
}
