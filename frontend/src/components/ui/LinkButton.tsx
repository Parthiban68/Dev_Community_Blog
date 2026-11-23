import { Link, type LinkProps } from 'react-router-dom';
import type { ButtonVariant } from './Button';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  quiet: 'btn-quiet',
};

type LinkButtonProps = LinkProps & {
  variant?: ButtonVariant;
};

export function LinkButton({ variant = 'primary', className = '', ...props }: LinkButtonProps) {
  return <Link className={`btn ${variantClasses[variant]} ${className}`} {...props} />;
}
