import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username.'),
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .pipe(z.email('Enter a valid email address.'));

const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Use at most 128 characters.')
  .refine((value) => /[A-Z]/.test(value), 'Include an uppercase letter.')
  .refine((value) => /[a-z]/.test(value), 'Include a lowercase letter.')
  .refine((value) => /\d/.test(value), 'Include a number.')
  .refine((value) => /[^A-Za-z0-9]/.test(value), 'Include a symbol.');

export const registerFields = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Use at least 3 characters.')
    .max(30, 'Use at most 30 characters.')
    .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, hyphens or underscores only.'),
  email: emailSchema,
  displayName: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(80, 'Use at most 80 characters.'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm your password.'),
});

export const registerSchema = registerFields.refine(
  (values) => values.password === values.confirmPassword,
  { path: ['confirmPassword'], message: 'Passwords do not match.' },
);

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export interface PasswordStrength {
  score: number;
  label: string;
}

const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: strengthLabels[0] };
  }

  let passed = 0;
  if (password.length >= 8) passed += 1;
  if (password.length >= 12) passed += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) passed += 1;
  if (/\d/.test(password)) passed += 1;
  if (/[^A-Za-z0-9]/.test(password)) passed += 1;

  const score = Math.min(4, Math.max(0, passed - 1));
  return { score, label: strengthLabels[score] };
}

export function suggestUsernameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const cleaned = localPart
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : '';
}
