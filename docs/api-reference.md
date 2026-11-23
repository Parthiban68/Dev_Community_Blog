# API Reference

Base URL: `http://localhost:3000/api/v1`
Swagger UI: `http://localhost:3000/api/docs`

## Response envelope

Every JSON endpoint is wrapped by `ResponseInterceptor`. The envelope `statusCode` is read from the HTTP response status code.

Success:

```json
{
  "date": "2026-11-23T00:00:00.000Z",
  "message": "Request successful",
  "statusCode": 200,
  "records": {}
}
```

Validation failure:

```json
{
  "date": "2026-11-23T00:00:00.000Z",
  "message": "Validation failed",
  "statusCode": 400,
  "records": null,
  "details": ["limit must not be less than 1"]
}
```

Other failures use the same envelope with `records: null` and the exception message, for example `401` `Invalid credentials.`. The GitHub OAuth redirect endpoints are the only routes that do not return the envelope: they issue HTTP redirects, and their error paths still use the envelope.

## Public endpoints (Phase 01)

### `GET /public/platform`

Public landing content. No authentication required.

Returns the approved hero copy, introduction, six features, four steps and registration CTA.

### `GET /public/communities/featured`

Query parameters:

- `limit` — optional integer, 1–12.

Currently returns an empty featured collection with `available: false`.

### `GET /public/projects/featured`

Query parameters:

- `limit` — optional integer, 1–12.

Currently returns an empty featured collection with `available: false`.

### `GET /public/events/upcoming`

Query parameters:

- `limit` — optional integer, 1–12.

Currently returns an empty featured collection with `available: false`.

## Authentication (Phase 02)

All auth routes are prefixed with `/api/v1/auth`. Request bodies are validated with `class-validator`; unknown body fields are rejected (`whitelist` + `forbidNonWhitelisted`). Username and email inputs are trimmed and lowercased.

### Shared session records

`POST /auth/register`, `POST /auth/login` and `POST /auth/refresh` return the same `records` shape:

```json
{
  "user": {
    "id": "uuid",
    "username": "ada",
    "email": "ada@example.com",
    "displayName": "Ada",
    "bio": null,
    "avatarUrl": null,
    "status": "active",
    "emailVerified": false,
    "emailVerifiedAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-11-23T00:00:00.000Z"
  },
  "accessToken": "jwt",
  "csrfToken": "base64url-token",
  "requiresOnboarding": true,
  "verificationRequired": false,
  "emailVerified": false
}
```

- `user` is a `SafeUser` record. `status` is one of `active`, `disabled`, `suspended`. `passwordHash` and raw tokens are never returned.
- `accessToken` is a short-lived JWT (payload `sub`, `username`, `email`) signed with `JWT_ACCESS_SECRET`, expiring after `JWT_ACCESS_TTL` (default `15m`). Send it as `Authorization: Bearer <accessToken>`.
- `csrfToken` is also delivered as the readable `csrf_token` cookie.
- `requiresOnboarding` is `true` until `onboardingCompleted` is set.
- `verificationRequired` mirrors `EMAIL_VERIFICATION_REQUIRED`; `emailVerified` reflects whether `emailVerifiedAt` is set.
- The refresh token is **not** in the body. It is delivered only as the `refresh_token` HttpOnly cookie.

Cookies set by register/login/refresh (and the GitHub callback):

| Cookie | HttpOnly | Secure | SameSite | Path | Max-Age |
| --- | --- | --- | --- | --- | --- |
| `refresh_token` | yes | production only | `COOKIE_SAME_SITE` (default `lax`) | `/` | `REFRESH_TOKEN_TTL_DAYS` × 24h (default 7d) |
| `csrf_token` | no | production only | `COOKIE_SAME_SITE` | `/` | same as refresh |

`COOKIE_DOMAIN` is applied when set. CSRF protection uses the double-submit pattern: the `X-CSRF-Token` header must match the `csrf_token` cookie (timing-safe comparison) on `POST /auth/refresh` and `POST /auth/logout`.

### `POST /auth/register`

Throttle: 5 requests / 60s.

Request body:

```json
{
  "username": "ada",
  "email": "ada@example.com",
  "password": "Valid-password1!",
  "displayName": "Ada"
}
```

- `username` — required, `^[a-z0-9_-]{3,30}$` after trim/lowercase.
- `email` — required, valid email, max 254.
- `password` — required strong password: 12–128 characters with at least one uppercase letter, one lowercase letter, one digit and one symbol.
- `displayName` — optional, max 80; defaults to the username.

Behavior: hashes the password with argon2id, creates an `active` user with `onboardingCompleted: false`, then issues a session (sets cookies, returns shared session records).

Errors:

- `400` validation failure, or reserved username (`Username is not available.`). Reserved names: `admin`, `api`, `auth`, `root`, `devcommons`, `support`, `help`, `me`, `login`, `register`, `settings`.
- `409` `Username or email is already in use.`

### `POST /auth/login`

Throttle: 5 requests / 60s.

Request body:

```json
{
  "identifier": "ada",
  "password": "Valid-password1!"
}
```

- `identifier` — required, non-empty, max 254; matched against username **or** email after trim/lowercase.
- `password` — required, non-empty, max 128.

Behavior: verifies the argon2id hash, checks account status and the email-verification gate, then issues a session (sets cookies, returns shared session records).

Errors:

- `400` validation failure. Unknown body fields are rejected by the global pipe.
- `401` `Invalid credentials.` — generic for unknown user, OAuth-only account (no password hash) or wrong password. A dummy hash is verified for unknown users to equalize timing.
- `403` `Account is not active.` when `status` is not `active`.
- `403` `Email verification required.` when `EMAIL_VERIFICATION_REQUIRED=true` and the email is not verified.

### `POST /auth/refresh`

Throttle: 30 requests / 60s. Requires the `refresh_token` cookie and a matching `X-CSRF-Token` header.

Request body: empty (`{}`).

Behavior: looks up the session by SHA-256 hash of the refresh cookie, rotates it inside a transaction (issues a new refresh token in the same family, revokes the old one) and returns shared session records with fresh cookies.

Errors:

- `401` `Invalid refresh token.` — missing/expired/unknown token.
- `401` `Invalid refresh token.` — reuse of an already-revoked token also revokes the entire token family (reuse detection).
- `403` `Invalid CSRF token.` when the header/cookie pair is missing or mismatched.
- `403` `Account is not active.`

### `POST /auth/logout`

Throttle: 30 requests / 60s. Requires a matching `X-CSRF-Token` header and `csrf_token` cookie. The `refresh_token` cookie is used to revoke the session family when present.

Request body: empty (`{}`).

Behavior: revokes the current session family and clears the `refresh_token` and `csrf_token` cookies.

Response `records`:

```json
{ "loggedOut": true }
```

Errors:

- `403` `Invalid CSRF token.` when the header/cookie pair is missing or mismatched.

Logout is idempotent: a missing or unknown refresh cookie still returns `{ "loggedOut": true }`.

### `POST /auth/forgot-password`

Throttle: 3 requests / 60s.

Request body:

```json
{ "email": "ada@example.com" }
```

- `email` — required, valid email, max 254.

Behavior: always returns the same generic message regardless of whether the account exists. When a user is found, previous unused reset tokens are marked used and a new token (SHA-256 hash stored) is created with a `PASSWORD_RESET_TTL_MINUTES` expiry (default 15).

Response `records`:

```json
{
  "message": "If an account exists for that email, a password reset link has been sent."
}
```

Email delivery is **not implemented**. The generic message is returned even though no email is sent. In non-production environments with `EMAIL_DELIVERY_ENABLED=false`, the response additionally includes a development-only reset URL:

```json
{
  "message": "If an account exists for that email, a password reset link has been sent.",
  "devResetUrl": "http://localhost:5173/reset-password?token=<token>"
}
```

`devResetUrl` is never returned in production or when email delivery is enabled. It is only present when a matching user exists.

Errors:

- `400` validation failure.

### `POST /auth/reset-password`

Throttle: 5 requests / 60s.

Request body:

```json
{
  "token": "<reset-token>",
  "password": "Valid-password1!"
}
```

- `token` — required, non-empty, max 512.
- `password` — required strong password (same rules as registration).

Behavior: validates the token by SHA-256 hash, re-hashes the new password with argon2id, marks the token used and revokes **all** of the user's sessions inside a transaction.

Response `records`:

```json
{ "reset": true }
```

Errors:

- `400` validation failure.
- `400` `Invalid or expired reset token.` — unknown, already-used or expired token, or missing user.

### `GET /auth/check-username?username=`

Throttle: 20 requests / 60s.

Query parameters:

- `username` — required, non-empty, max 30; trimmed/lowercased.

Response `records`:

```json
{ "available": true }
```

`available` is `false` when the username fails the `^[a-z0-9_-]{3,30}$` pattern, is reserved, or already exists.

Errors:

- `400` validation failure (missing/empty/too-long input).

### `GET /auth/check-email?email=`

Throttle: 20 requests / 60s.

Query parameters:

- `email` — required, valid email, max 254; trimmed/lowercased.

Response `records`:

```json
{ "available": true }
```

`available` is `false` when the email already exists.

Errors:

- `400` validation failure.

### `GET /auth/github`

Throttle: 10 requests / 60s. Starts the GitHub OAuth flow.

Behavior: when GitHub credentials are configured, sets a short-lived `github_oauth_state` HttpOnly cookie (SameSite `lax`, 10-minute max-age) and redirects (`302`) to `https://github.com/login/oauth/authorize` with scope `read:user user:email` and a signed state.

Errors:

- `503` `GitHub sign-in is not configured.` when `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` is unset. This is the default state until credentials are provided.

There is no `GET /auth/github/status` endpoint. The frontend probes availability honestly by requesting this route with `redirect: 'manual'` and treating an opaque redirect as "configured".

### `GET /auth/github/callback`

Throttle: 10 requests / 60s. Completes the GitHub OAuth flow.

Query parameters: `code` and `state` (provided by GitHub).

Behavior: validates the signed state against the `github_oauth_state` cookie, exchanges the code for a GitHub access token, fetches the profile and a verified email, links or creates the user and `oauth_accounts` record (GitHub access token stored as a SHA-256 hash), issues a session (sets cookies) and redirects (`302`) to `FRONTEND_BASE_URL`.

Errors:

- `503` `GitHub sign-in is not configured.` when credentials are unset.
- `400` `Invalid GitHub OAuth state.` when code/state/cookie are missing or the state signature does not match.
- `400` `GitHub sign-in failed.` when the token exchange or profile fetch fails.
- `400` `GitHub account has no verified email address.`
- `403` `Account is not active.`
- `409` `Unable to allocate a username for this GitHub account.`

## Users (Phase 02)

### `GET /users/me`

Throttle: 60 requests / 60s. Requires `Authorization: Bearer <accessToken>`.

Response `records`:

```json
{
  "user": {
    "id": "uuid",
    "username": "ada",
    "email": "ada@example.com",
    "displayName": "Ada",
    "bio": null,
    "avatarUrl": null,
    "status": "active",
    "emailVerified": false,
    "emailVerifiedAt": null,
    "onboardingCompleted": false,
    "createdAt": "2026-11-23T00:00:00.000Z"
  }
}
```

Errors:

- `401` `Authentication required.` when the Bearer header is missing.
- `401` `Invalid or expired token.` when JWT verification fails.
- `401` `User no longer exists.`
- `403` `Account is not active.`
- `500` `JWT access secret is not configured.` when `JWT_ACCESS_SECRET` is unset.

### `POST /users/onboarding/complete`

Throttle: 30 requests / 60s. Requires `Authorization: Bearer <accessToken>`. No request body.

Response `records`:

```json
{
  "user": {
    "id": "uuid",
    "username": "ada",
    "email": "ada@example.com",
    "displayName": "Ada",
    "bio": null,
    "avatarUrl": null,
    "status": "active",
    "emailVerified": false,
    "emailVerifiedAt": null,
    "onboardingCompleted": true,
    "createdAt": "2026-11-23T00:00:00.000Z"
  }
}
```

Errors are the same as `GET /users/me`. The endpoint is idempotent: calling it again returns the same user with `onboardingCompleted: true`.

## Security notes

- Passwords are hashed with argon2id.
- Refresh, password-reset and GitHub OAuth access tokens are 32-byte base64url values; only their SHA-256 hashes are persisted.
- Access tokens are short-lived JWTs; refresh tokens live in an HttpOnly cookie (`Secure` in production, configurable `SameSite`).
- Refresh rotation with family reuse detection revokes the whole family when a revoked token is replayed.
- CSRF double-submit (`X-CSRF-Token` header vs `csrf_token` cookie) guards refresh and logout.
- Per-route throttling supplements the global rate limit.
- Login uses a generic invalid-credentials message and a dummy-hash timing equalizer; account status is checked on login, refresh, GitHub sign-in and `GET /users/me`.
- Password reset revokes all of the user's sessions.
- Tokens and secrets are never logged.

## Notes

- All endpoints are prefixed with `/api/v1`.
- Unknown query and body fields are rejected by the global validation pipe.
- Global throttling is enabled (`THROTTLE_LIMIT` per `THROTTLE_TTL`), with stricter per-route limits on auth endpoints.
- Featured public endpoints will query real tables when those modules are implemented; no mock records are returned.
- Email delivery and the email-verification token flow are not implemented yet; `EMAIL_VERIFICATION_REQUIRED` only gates login. GitHub OAuth returns `503` until credentials are configured.
