# API Contract

## Conventions

Base:
`/api` may be used as a prefix depending on backend configuration.

Authentication:
```http
Authorization: Bearer <JWT>
```

JSON request/response unless otherwise noted.

Use consistent HTTP status codes and predictable error shapes.

## Auth

### POST `/auth/register`

Creates a user.

Request:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

Role must be assigned by the backend according to the registration flow; do not let a normal farmer arbitrarily self-assign ADMIN.

### POST `/auth/login`

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response should include:
- token
- authenticated user identity
- backend-determined role

## Farms

### GET `/farms`

Returns farms owned by current farmer.

### POST `/farms`

Request concept:
```json
{
  "name": "string",
  "lat": 0,
  "lng": 0,
  "land_area_ha": 0,
  "commodity": "string",
  "season_label": "optional"
}
```

Validation:
- name required
- valid coordinates
- area > 0
- commodity required

Success:
- unique Digital Farm ID
- status REGISTERED

### GET `/farms/:id`

Returns farm detail after ownership/role authorization.

## Insurance

### GET `/farms/:id/insurance`

Returns insurance status and coverage summary permitted by MVP.

## Farm data

### POST `/farms/:id/data`

Submit data for the relevant season.

Payload must reflect PRD-defined fields.

### GET `/farms/:id/data`

Returns history.

### Evidence

Evidence upload strategy may use a dedicated endpoint or multipart flow. Keep it isolated from the core farm-data contract.

## Scoring

### GET `/farms/:id/score`

Example response:
```json
{
  "fss_value": 82,
  "is_provisional": false,
  "breakdown": {
    "productivity": 18
  }
}
```

The real response should contain the full PRD-approved breakdown.

Score recalculation occurs after relevant verified data changes.

## Rewards

### GET `/rewards`

Example:
```json
{
  "total_points": 730,
  "tier": "GOLD",
  "history": []
}
```

## Carbon readiness

### GET `/carbon/readiness`

Example:
```json
{
  "crs_value": 68,
  "breakdown": {
    "eligible_practice": 30
  }
}
```

## Carbon projects

### GET `/carbon/projects`

Returns candidate project data allowed for farmer context.

### GET `/carbon/projects/:id`

Returns project detail allowed by role.

## Corporate

### GET `/corporate/projects`

Returns aggregate candidate/assessment/aggregating projects.

### GET `/corporate/projects/:id`

Returns:
- project identity
- aggregate farm count
- aggregate area
- commodity
- region
- lifecycle status

Must not expose individual farmer identity.

## Admin

The PRD marks some admin endpoints as TBD. Implement them with stable REST contracts while preserving the stated intent.

### GET `/admin/data-review`

Returns farm data waiting for review.

### PATCH `/admin/data-review/:id`

Verify or reject.

Reject requires a reason.

### GET `/admin/carbon-projects`

List projects.

### POST `/admin/carbon-projects`

Create candidate project.

### PATCH `/admin/carbon-projects/:id`

Change lifecycle state according to permitted transitions.

## Error shape

Recommended:
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Human readable message",
  "details": {}
}
```

The exact shape can be finalized during backend setup, but keep it consistent across endpoints.

## API rules

- Never return password hashes.
- Never trust client-provided user IDs for ownership.
- Derive authenticated user from JWT.
- Check ownership server-side.
- Validate all write requests.
- Use idempotency/basic duplicate protection for duplicate submissions where applicable.
- Do not expose corporate-restricted farmer data.
