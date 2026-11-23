# Architecture

## Shape

The repository is a local monorepo with two independent packages:

- `frontend/` — React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query and Axios.
- `backend/` — NestJS modular monolith, TypeScript, Sequelize, PostgreSQL, class-validator and Swagger.
- `docs/` — architecture, database schema, API reference and implementation progress.
- `docker-compose.yml` — local PostgreSQL service.

There is no multi-tenant layer. Every member belongs to one global community and all data shares one database.

## Backend

The backend is a modular monolith. Phase 01 only creates the modules needed by the public landing page:

- `AppModule` — global config, database, throttling, response envelope, exception handling and validation.
- `DatabaseModule` — Sequelize connection with `synchronize: false` and SSL when `DATABASE_URL` requests it.
- `PublicModule` — read-only public endpoints.

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

Security currently includes Helmet, configurable CORS with credentials, request validation, whitelisting of unknown query fields and global rate limiting. Authentication, cookies, CSRF and resource authorization are introduced in Phase 02.

## Frontend

The frontend uses a feature-oriented structure:

- `src/app/` — application providers and router.
- `src/components/` — reusable UI, common and layout pieces.
- `src/features/landing/` — landing page sections and landing-specific hooks/content helpers.
- `src/lib/` — Axios client and TanStack Query client.
- `src/services/` — typed API calls.
- `src/stores/` — Zustand theme preference.
- `src/hooks/` — theme synchronization.
- `src/styles/` — Tailwind entry point and design tokens.

All API data is fetched through `src/services/landing.service.ts`. Components receive typed data and do not contain API URLs or hardcoded response records.

## Theme

Light, dark and system preferences are supported. The CSS variables in `src/styles/index.css` map to Tailwind color tokens. A small inline script in `index.html` applies the persisted preference before first paint, preventing an incorrect-theme flash. Zustand persists the user choice in `localStorage`.

## Data flow

```text
Browser -> Axios (/api/v1) -> Nest controller -> DTO validation -> Service -> Response envelope
Browser <- TanStack Query <- typed API service <- Response envelope <- Nest response interceptor
```

Featured community, project and event endpoints are database-backed contracts that currently return honest empty collections because their domain modules and tables do not exist until later phases.
