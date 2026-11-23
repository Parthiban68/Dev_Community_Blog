import { getPasswordStrength } from '../validation';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const { score, label } = getPasswordStrength(password);
  const fillColor = 'var(--auth-text)';

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="h-1 flex-1"
            style={{ backgroundColor: index < score ? fillColor : 'var(--auth-border)' }}
          />
        ))}
      </div>
      <p className="auth-muted mt-1.5 text-xs">Password strength: {label}</p>
    </div>
  );
}
