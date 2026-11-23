import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function AuthTextField({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: AuthTextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const describedBy = [props['aria-describedby'], error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="auth-field">
      <label htmlFor={fieldId} className="auth-label">
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        className={`auth-input ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {error ? (
        <p id={errorId} role="alert" className="auth-field-error">
          {error}
        </p>
      ) : null}
      {hint}
    </div>
  );
}
