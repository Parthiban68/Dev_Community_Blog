# Database Schema

## Phase 01 status

Phase 01 has no application tables. Landing narrative content is curated static content in the backend and is explicitly separated from database-backed sections.

Sequelize is configured for PostgreSQL with:

- `synchronize: false`
- UUID primary keys when tables are introduced
- `created_at` and `updated_at` on future domain tables
- migrations under `backend/src/database/migrations/`
- seeders under `backend/src/database/seeders/`

Running `npm run migrate` creates Sequelize's `SequelizeMeta` migration tracking table. No domain migration exists yet.

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

| Phase | Tables |
| --- | --- |
| 02 | `users`, auth sessions or refresh-token records, OAuth account records |
| 03 | `profiles`, `skills`, `user_skills` |
| 04 | `posts`, `post_tags`, `comments`, `reactions`, `bookmarks` |
| 05 | `follows` |
| 06 | `communities`, `community_members`, `discussions`, `discussion_tags`, `answers`, `answer_votes` |
| 07 | `projects`, `project_skills`, `project_roles`, `project_applications` |
| 08 | indexes supporting developer search and filters |

No tenant schema or tenant-specific database is planned.
