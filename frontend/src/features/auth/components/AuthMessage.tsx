import type { ReactNode } from 'react';

interface AuthMessageProps {
  tone: 'error' | 'success' | 'info';
  children: ReactNode;
  id?: string;
}

export function AuthMessage({ tone, children, id }: AuthMessageProps) {
  return (
    <div
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      className={`auth-alert auth-alert-${tone}`}
    >
      {children}
    </div>
  );
}
