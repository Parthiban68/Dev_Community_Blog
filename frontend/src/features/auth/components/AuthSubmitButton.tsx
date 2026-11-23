import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText: string;
  children: ReactNode;
}

export function AuthSubmitButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  type = 'submit',
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`btn-auth-primary auth-submit ${className}`}
    >
      {loading ? (
        <>
          <span className="auth-spinner" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
