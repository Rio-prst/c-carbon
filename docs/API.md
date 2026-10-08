# API Contract

## Conventions

Base:
No global prefix is set by the backend, so paths are absolute. If the app is
mounted behind one, prefix them all.

Authentication:
```http
Authorization: Bearer <JWT>
```

JSON request/response unless otherwise noted.

Use consistent HTTP status codes and predictable error shapes.

Roles are enforced by a guard, never by the client hiding a screen. A role that
is not permitted receives `403`; a resource that does not exist or belongs to
someone else receives `404` so its existence cannot be probed.

## Error shape

Every error, including those raised by the global filter:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Human readable message",
  "details": {}
}
```

## Auth

### POST `/auth/register`

Creates a farmer.

Request:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

Response:
```json
{ "token": "string", "user": { "id": "string", "name": "string", "email": "string", "role": "FARMER" } }
```

The role is assigned by the backend and is always `FARMER`. Corporate and
admin identities are not self-service; they exist through a separate flow.

Password minimum is 8 characters.

### POST `/auth/login`

Request:
```json
{ "email": "string", "password": "string" }
```

Response:
```json
{ "token": "string", "user": { "id": "string", "name": "string", "email": "string", "role": "FARMER" } }
```

The token lifetime is configured with `JWT_EXPIRES_IN`.

### GET `/auth/me`

Returns the authenticated user.

## Farms

### GET `/farms`

Returns farms owned by the current farmer. `FARMER` only.

### POST `/farms`

Request:
```json
{
  "name": "string",
  "lat": 0,
  "lng": 0,
  "land_area_ha": 0,
  "commodity": "string"
}
```

Validation:
- name required
- valid coordinates
- land_area_ha > 0
- commodity required

Success:
- unique Digital Farm ID, generated server side
- status `REGISTERED`

### GET `/farms/:id`

Returns farm detail. `404` when the farm does not exist or is not owned by the
caller.

## Insurance

### GET `/farms/:farmId/insurance`

`PENDING`, `ACTIVE` or `EXPIRED`, plus coverage summary. Read-only; the
platform does not underwrite the policy.

## Farm data

### POST `/farms/:farmId/data`

Submit data for a season.

Request:
```json
{
  "farm_season_id": "string",
  "yield_kg": 0,
  "water_usage": 0,
  "fertilizer_usage": 0,
  "pesticide_usage": 0,
  "energy_usage": 0,
  "waste_management_practice": "string",
  "soil_practice": "string",
  "low_carbon_practice": true
}
```

A successful submission recalculates the provisional FSS and awards points. A
failure in either is logged and does not fail the request, so recorded
production data is never lost to a side effect.

### GET `/farms/:farmId/data`

Submission history for the farm.

### PATCH `/farms/:farmId/data/:id/status`

```json
{ "status": "VERIFIED", "rejection_reason": "required when REJECTED" }
```

Transitions: `SELF_REPORTED -> REVIEW -> VERIFIED`, or `-> REJECTED`. Rejecting
requires a reason, and a reason is cleared when the status moves away from
`REJECTED`. A verification recalculates the FSS.

### POST `/farms/:farmId/data/seasons`

Creates a season. Request: `{ "season_label": "string", "start_date": "date",
"end_date": "date", "sequence_number": 0 }`. All fields are optional.

### GET `/farms/:farmId/data/seasons`

Seasons for the farm.

## Evidence

### POST `/farms/:farmId/evidence`

Records a reference only:

```json
{ "farm_data_id": "string", "type": "FIELD_PHOTO", "file_name": "string", "url": "string" }
```

### GET `/farms/:farmId/evidence/:farmDataId`

Lists evidence for a submission. Entries whose file is stored also carry
`downloadUrl`, `size_bytes` and `content_type`. Entries without a stored file
report no `downloadUrl`, so a record that was never given bytes is not
presented as openable.

### POST `/farms/:farmId/evidence/:farmDataId/upload`

`multipart/form-data` with a single `file` part. Stores the bytes and returns
the created record.

Accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`,
`application/pdf`. Limit is 10 MB.

Failure codes: `EVIDENCE_UNSUPPORTED_TYPE` and `EVIDENCE_TOO_LARGE` are
`400`; `EVIDENCE_STORAGE_UNAVAILABLE` is `503`. A storage failure is
deliberately retryable and does not affect the submission itself.

Files live in a private bucket. They are reachable only through a signed URL
that expires after 300 seconds, issued after the ownership check, so a file
cannot be opened by anyone who guesses a storage key.

## Scoring

### GET `/farms/:farmId/score`

Response:
```json
{
  "fss_value": 82,
  "is_provisional": true,
  "breakdown": { "productivity": 18 },
  "provisional_reason": "string",
  "reference_ranges": []
}
```

Returns `null` when no score has been calculated yet, which the client shows as
"Belum tersedia" rather than zero.

## Rewards

### GET `/rewards`

```json
{ "total_points": 730, "tier": "GOLD", "history": [] }
```

### POST `/rewards/events`

`ADMIN` only. Records an award against a user, which is how review and
aggregation actions credit the farmer.

## Carbon readiness

### GET `/farms/:farmId/readiness`

```json
{
  "crs_value": 68,
  "is_provisional": true,
  "breakdown": { "eligible_practice": 30 },
  "unavailable": [],
  "next_actions": [],
  "disclaimer": "string"
}
```

`unavailable` reports components that could not be assessed rather than scoring
them as zero. `baseline_availability` is always absent from it in MVP because
baseline determination is out of scope, so CRS is never a carbon-credit claim.

Recalculation is triggered by data changes. The endpoint caches the value and
only rewrites it when the result actually changed, so repeated reads do not
churn the record.

## Carbon projects

### GET `/carbon/projects`

`FARMER`, `CORPORATE`, `ADMIN`. Returns candidate, assessment and aggregating
projects as aggregates. No farm membership and no farmer identity, per
BUSINESS-RULES.md §10.

Response item:
```json
{
  "id": "string",
  "name": "string",
  "status": "CANDIDATE",
  "region": "string",
  "commodity_focus": "string",
  "total_farms": 0,
  "total_area_ha": 0,
  "created_at": "iso",
  "is_provisional": true
}
```

### GET `/carbon/projects/:id`

Project detail, same aggregate shape.

> Deviation from an earlier draft: `/corporate/projects` was specified
> separately. It is deliberately not implemented. The same aggregate is already
> returned here and `CORPORATE` is already an accepted role, so a second
> endpoint would mean two contracts for one dataset. Corporate gets the
> overview below instead.

## Corporate

### GET `/corporate/overview`

`CORPORATE` only.

```json
{
  "company_name": "string",
  "industry": "string",
  "region": "string",
  "total_farms": 0,
  "total_area_ha": 0,
  "project_count": 0,
  "commodities": [],
  "regions": [],
  "status_breakdown": [{ "status": "AGGREGATING", "count": 1 }],
  "is_provisional": true,
  "disclaimer": "string"
}
```

`total_farms` counts distinct farms, because a farm may join more than one
project. `total_area_ha` is summed per project and may therefore be larger.

## Consent

### GET `/consent`

`FARMER` only. Returns the grant history, newest first:

```json
{
  "consents": [
    {
      "purpose": "carbon_project",
      "consent_version": "v1",
      "granted_at": "iso",
      "revoked_at": null,
      "active": true
    }
  ],
  "active_purposes": ["carbon_project"],
  "carbon_project_granted": true,
  "notice": "string"
}
```

### POST `/consent/revoke`

```json
{ "purpose": "carbon_project" }
```

Stamps `revoked_at` on the open grant rather than deleting it, so the
withdrawal stays on record. A farm whose owner withdrew is excluded from
aggregation.

### POST `/consent/grant`

Same body. Appends a new grant so a withdrawal is reversible; both the withdrawal
and the new grant remain in the history.

## Admin

### GET `/admin/farm-data`

Farm data awaiting review. `FARMER` and `ADMIN` may reach another farmer's farm
through the review queue, but the queue itself is `ADMIN` only.

> Path renamed from the `/admin/data-review` in the original draft. The
> implementation is `/admin/farm-data`.

### POST `/admin/farm-data/:id/verify`

Verifies a submission, recalculates the FSS, awards points and writes an audit
entry.

### POST `/admin/farm-data/:id/reject`

```json
{ "rejectionReason": "required" }
```

A reason is mandatory.

### PATCH `/admin/farm-data/:id/start-review`

Moves `SELF_REPORTED` to `REVIEW`. Rejects a submission already in review.

### GET `/admin/audit-log`

Audit entries, newest first. Persisted, so entries survive a restart.

### GET `/admin/carbon-projects`

`ADMIN` only. Same aggregate shape as the farmer-facing list.

### POST `/admin/carbon-projects`

```json
{ "name": "string", "region": "string", "commodityFocus": "string" }
```

Creates a project in `CANDIDATE`.

### GET `/admin/carbon-projects/eligible-farms`

Inspect the filter before acting:

```json
{
  "eligible": [],
  "rejected": [],
  "min_required": 3,
  "min_eligible_now": 0,
  "not_assessed": []
}
```

Each farm carries per-criterion pass/fail with a reason, so a withdrawn consent
is distinguishable from incomplete data.

### POST `/admin/carbon-projects/:id/aggregate`

Attaches every eligible farm whose commodity matches the project focus. Requires
at least three, otherwise `409 NOT_ENOUGH_ELIGIBLE_FARMS` and nothing is
written. The error details include `blocked_by_missing_consent` so a withdrawal
is not mistaken for missing data. Farms are never added to reach the threshold.
On success the project moves to `AGGREGATING`.

### PATCH `/admin/carbon-projects/:id/status`

```json
{ "status": "ASSESSMENT" }
```

Forward only: `CANDIDATE -> ASSESSMENT -> AGGREGATING`. Backwards returns
`409`. `VERIFICATION` through `TRADING` return
`400 PROJECT_STATUS_NOT_SUPPORTED`, since MVP must not imply that registration,
issuance or trading happened.

Every lifecycle change writes an audit entry.

## API rules

- Never return password hashes.
- Never trust client-provided user IDs for ownership.
- Derive the authenticated user from the JWT.
- Check ownership server-side.
- Validate all write requests.
- Do not expose corporate-restricted farmer data.

## Known gaps

- `POST /rewards/events` accepts a client-supplied `user_id`. It is `ADMIN` only
  and used by internal flows, but it should be an internal call rather than an
  HTTP surface.
- Scoring has no history. `scores` stores one row per farm and score type, so a
  score chart is not possible. `superseded_at` is present in anticipation, but
  nothing writes it. `MVP-SCOPE.md` places score history charts in P1/P2.