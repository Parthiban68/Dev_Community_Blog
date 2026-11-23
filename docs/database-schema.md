# Database Schema

## Conventions

Sequelize is configured for PostgreSQL with:

- `synchronize: false`
- UUID primary keys (`UUIDV4` default)
- `created_at` and `updated_at` timestamps on domain tables (snake_case columns via `underscored: true`)
- migrations under `backend/src/database/migrations/`
- seeders under `backend/src/database/seeders/`

Running `npm run migrate` applies migrations and records them in Sequelize's `SequelizeMeta` tracking table.

## Phase 01 status

Phase 01 introduced no application tables. Landing narrative content is curated static content in the backend and is explicitly separated from database-backed sections.

## Phase 02 auth tables

Migration: `backend/src/database/migrations/20261123000000-create-auth-tables.cjs`

Creates four tables — `users`, `auth_sessions`, `password_reset_tokens`, `oauth_accounts` — with UUID primary keys, cascade foreign keys to `users`, unique constraints and supporting indexes. Entities live under `backend/src/modules/auth/entities/`. The `down` migration drops the tables in reverse order and removes the `enum_users_status` type.

### `users`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | primary key, default `UUIDV4` |
| `username` | VARCHAR(30) | not null, unique |
| `email` | VARCHAR(254) | not null, unique |
| `password_hash` | VARCHAR(255) | nullable (null for OAuth-only accounts) |
| `display_name` | VARCHAR(80) | not null |
| `bio` | TEXT | nullable |
| `avatar_url` | VARCHAR(2048) | nullable |
| `status` | ENUM(`active`,`disabled`,`suspended`) | not null, default `active` |
| `email_verified_at` | timestamptz | nullable |
| `onboarding_completed` | BOOLEAN | not null, default `false` |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Passwords are stored as argon2id hashes. `email_verified_at` being null means the email is unverified.

### `auth_sessions`

Refresh-token session records. The raw refresh token is never stored; only its SHA-256 hash is persisted.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | primary key, default `UUIDV4` |
| `user_id` | UUID | not null, FK → `users.id` ON DELETE CASCADE |
| `family_id` | UUID | not null (groups rotated tokens in one lineage) |
| `refresh_token_hash` | CHAR(64) | not null, unique |
| `expires_at` | timestamptz | not null |
| `revoked_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Indexes: `auth_sessions_user_id_idx` (`user_id`), `auth_sessions_family_id_idx` (`family_id`).

Rotation issues a new row in the same `family_id` and revokes the previous row. Reuse of a revoked token revokes the whole family.

### `password_reset_tokens`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | primary key, default `UUIDV4` |
| `user_id` | UUID | not null, FK → `users.id` ON DELETE CASCADE |
| `token_hash` | CHAR(64) | not null, unique (SHA-256 of the reset token) |
| `expires_at` | timestamptz | not null |
| `used_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Index: `password_reset_tokens_user_id_idx` (`user_id`).

Requesting a reset marks prior unused tokens used; a successful reset marks the token used and revokes all of the user's sessions.

### `oauth_accounts`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | primary key, default `UUIDV4` |
| `user_id` | UUID | not null, FK → `users.id` ON DELETE CASCADE |
| `provider` | VARCHAR(32) | not null (currently `github`) |
| `provider_account_id` | VARCHAR(191) | not null |
| `access_token_hash` | CHAR(64) | nullable (SHA-256 of the provider access token) |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Unique index: `oauth_accounts_provider_account_unique` (`provider`, `provider_account_id`).

### Relationships

- `users` 1 → N `auth_sessions` (cascade delete)
- `users` 1 → N `password_reset_tokens` (cascade delete)
- `users` 1 → N `oauth_accounts` (cascade delete)
- `auth_sessions` rows are grouped by `family_id` for refresh rotation/reuse detection.
- `oauth_accounts` is unique per (`provider`, `provider_account_id`), linking one provider identity to one user.

## Database-backed landing contracts

The following endpoints are reserved for real records:

- `GET /api/v1/public/communities/featured`
- `GET /api/v1/public/projects/featured`
- `GET /api/v1/public/events/upcoming`

Until the `communities`, `projects` and events modules exist, they return:

```json
{
  "items": [],
  "total": 0,
  "available": false,
  "message": "...",
  "emptyLabel": "..."
}
```

The frontend renders these as explicit empty states. It does not substitute invented cards, member counts or activity statistics.

## Planned schema evolution

| Phase | Tables | Status |
| --- | --- | --- |
| 02 | `users`, `auth_sessions`, `password_reset_tokens`, `oauth_accounts` | Implemented |
| 03 | `profiles`, `skills`, `user_skills` | Pending |
| 04 | `posts`, `post_tags`, `comments`, `reactions`, `bookmarks` | Pending |
| 05 | `follows` | Pending |
| 06 | `communities`, `community_members`, `discussions`, `discussion_tags`, `answers`, `answer_votes` | Pending |
| 07 | `projects`, `project_skills`, `project_roles`, `project_applications` | Pending |
| 08 | indexes supporting developer search and filters | Pending |

No tenant schema or tenant-specific database is planned.
