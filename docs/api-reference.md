# API Reference

Base URL: `http://localhost:3000/api/v1`
Swagger UI: `http://localhost:3000/api/docs`

## Response envelope

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

## `GET /public/platform`

Public landing content. No authentication required.

Returns the approved hero copy, introduction, six features, four steps and registration CTA.

## `GET /public/communities/featured`

Query parameters:

- `limit` — optional integer, 1–12.

Currently returns an empty featured collection with `available: false`.

## `GET /public/projects/featured`

Query parameters:

- `limit` — optional integer, 1–12.

Currently returns an empty featured collection with `available: false`.

## `GET /public/events/upcoming`

Query parameters:

- `limit` — optional integer, 1–12.

Currently returns an empty featured collection with `available: false`.

## Notes

- All endpoints are prefixed with `/api/v1`.
- Unknown query fields are rejected by the global validation pipe.
- Global throttling is enabled.
- Featured endpoints will query real tables when those modules are implemented; no mock records are returned.
