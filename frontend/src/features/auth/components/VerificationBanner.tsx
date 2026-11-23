import type { VerificationNotice } from '../auth.types';
import { AuthMessage } from './AuthMessage';

interface VerificationBannerProps {
  notice?: VerificationNotice | null;
}

export function VerificationBanner({ notice }: VerificationBannerProps) {
  if (!notice?.required) {
    return null;
  }

  return (
    <AuthMessage tone="info">
      {notice.deliveryConfigured
        ? 'Email verification is required. A verification link has been sent to your email address.'
        : 'Email verification is required, but email delivery is not configured on this server, so no email was sent. In local development, an administrator must verify your account manually.'}
    </AuthMessage>
  );
}
