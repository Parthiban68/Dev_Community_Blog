# Architecture

## Shape

The repository is a local monorepo with two independent packages:

- `frontend/` — React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query and Axios.
- `backend/` — NestJS modular monolith, TypeScript, Sequelize, PostgreSQL, class-validator and Swagger.
- `docs/` — architecture, database schema, API reference and implementation progress.
- `backend/docker-compose.yml` — local PostgreSQL service.

Scripts are per-package (`npm --prefix backend run …`, `npm --prefix frontend run …`); there is no root package.json.

There is no multi-tenant layer. Every member belongs to one global community and all data shares one database.

## Backend

The backend is a modular monolith.

- `AppModule` — global config, database, throttling, response envelope, exception handling and validation; registers `PublicModule`, `UsersModule` and `AuthModule`.
- `DatabaseModule` — Sequelize connection with `synchronize: false` and SSL when `DATABASE_URL` requests it.
- `PublicModule` — read-only public landing endpoints (Phase 01).
- `AuthModule` (Phase 02) — `src/modules/auth`: auth controller and service, entities under `entities/`, DTOs under `dto/`, `guards/jwt-auth.guard.ts`, `guards/csrf.guard.ts`, `decorators/current-user.decorator.ts` and `auth.constants.ts`. Imports `AuthJwtModule` (async `JwtModule` configured from `JWT_ACCESS_SECRET`/`JWT_ACCESS_TTL`) and `UsersModule`.
- `UsersModule` (Phase 02) — `src/modules/users`: `GET /users/me` via `UsersService`, guarded by `JwtAuthGuard`.
- `common/utils/token.util.ts` — `generateToken` (32-byte base64url), `hashToken` (SHA-256 hex) and `safeEqual` (timing-safe compare).
- `common/types/safe-user.ts` — `SafeUser` shape and `toSafeUser` mapper that strips secrets.

Business logic lives in services; controllers only handle HTTP concerns. Request DTOs are validated with `class-validator` and `class-transformer`. Successful responses are wrapped by `ResponseInterceptor`:

```json
{
  "date": "ISO_TIMESTAMP",
  "message": "Request successful",
  "statusCode": 200,
  "records": {}
}
```

Failures use the same envelope with `records: null` and, for validation failures, a `details` array.

Security includes Helmet, `cookie-parser`, configurable CORS with credentials (allowing `Authorization` and `X-CSRF-Token`), request validation, whitelisting of unknown fields and global plus per-route rate limiting. Phase 02 adds argon2id password hashing, short-lived JWT access tokens, an HttpOnly refresh cookie with rotation and family reuse detection, CSRF double-submit protection on refresh/logout, hashed reset/OAuth tokens, account-status checks and generic invalid-credentials responses. Tokens and secrets are never logged.

## Frontend

The frontend uses a feature-oriented structure:

- `src/app/` — application providers and router. `AppProviders` wraps `AuthProvider` inside `BrowserRouter` (and `QueryClientProvider`).
- `src/components/` — reusable UI, common and layout pieces.
- `src/features/landing/` — landing page sections and landing-specific hooks/content helpers (Phase 01).
- `src/features/auth/` — Phase 02 authentication: `auth-store.ts` (memory-only access/CSRF tokens), `auth.types.ts`, `auth.errors.ts`, `auth.service.ts`, `auth-context.ts`, `AuthProvider.tsx`, `AuthLayout.tsx`, `ProtectedRoute.tsx`, the login/register/forgot-password/reset-password/onboarding/authenticated-home pages, `validation.ts`, and `components/` (`AuthMessage`, `PasswordField`, `PasswordStrengthMeter`, `GitHubButton`, `VerificationBanner`).
- `src/lib/` — Axios client and TanStack Query client. `api.ts` uses `withCredentials`, injects `Authorization: Bearer` and `X-CSRF-Token`, exposes `registerAuthRefreshHandler`, and performs a single retry on `401` after a refresh (excluding `/auth/*` routes).
- `src/services/` — typed API calls for landing data.
- `src/stores/` — Zustand theme preference.
- `src/hooks/` — theme synchronization (`useTheme`).
- `src/styles/` — Tailwind entry point and design tokens.

Landing data is fetched through `src/services/landing.service.ts`; auth data through `src/features/auth/auth.service.ts`. Components receive typed data and do not contain API URLs or hardcoded response records.

### Routing

Public routes: `/` (landing), `/login`, `/register`, `/forgot-password`, `/reset-password`. Protected routes (via `ProtectedRoute`): `/onboarding` and `/app`. `/communities`, `/projects` and `/events` remain placeholders. `ProtectedRoute` shows a loading state while the session restores, redirects unauthenticated users to `/login`, and routes users with `requiresOnboarding` to `/onboarding`.

### Auth state

`AuthProvider` restores a session once on mount via `POST /auth/refresh`, exposes `status` (`loading`/`authenticated`/`unauthenticated`), `user`, `requiresOnboarding`, and `login`/`register`/`logout`/`refresh`/`completeOnboarding` actions. Access and CSRF tokens live only in memory (`auth-store.ts`); the refresh token stays in the HttpOnly cookie.

## Theme

Light, dark and system preferences are supported through the Zustand theme store (`src/stores/theme.store.ts`), the `useTheme` hook, and a small inline pre-paint script in `index.html` that applies the persisted preference before first paint to prevent an incorrect-theme flash. The store persists the choice in `localStorage` (`devcommons-theme`) and toggles the `dark` class on `<html>`.

The Phase 01 monochrome redesign temporarily removed this behavior; the theme store and pre-paint script are now restored. The landing visual tokens remain strict monochrome (fixed black/white/gray values in `src/styles/index.css`) and do not change with the theme. Phase 02 auth screens use a separate, scoped set of `--auth-*` CSS variables that switch between light and dark (blue accent in light, dark surfaces in dark), so auth theming does not restyle the landing or any global tokens.

## Data flow

```text
Browser -> Axios (/api/v1) -> Nest controller -> DTO validation -> Service -> Response envelope
Browser <- TanStack Query <- typed API service <- Response envelope <- Nest response interceptor
```

Auth flow:

```text
login/register -> session records + HttpOnly refresh cookie + readable csrf cookie
access token (memory) -> Authorization: Bearer on protected calls
401 on a non-auth call -> single refresh (X-CSRF-Token + refresh cookie) -> retry once
refresh rotation -> new refresh token in same family; reuse of a revoked token revokes the family
```

Featured community, project and event endpoints are database-backed contracts that currently return honest empty collections because their domain modules and tables do not exist until later phases.
