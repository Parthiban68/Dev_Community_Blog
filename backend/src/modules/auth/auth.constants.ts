export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';
export const GITHUB_STATE_COOKIE = 'github_oauth_state';

export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'root',
  'devcommons',
  'support',
  'help',
  'me',
  'login',
  'register',
  'settings',
]);

export const GENERIC_RESET_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$weKCL4V4aMWptPJuEBA72g$fNnsBDaS6FNmHofQ7RJJg4Xq2i85+AV5NsqBkOrZ+po';
