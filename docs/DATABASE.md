# Database Specification

## Source

Derived from the database/ERD requirements in PRD v2.

Use PostgreSQL for the MVP.

Primary keys are UUID unless stated otherwise.

# 1. users

Purpose: authentication and role identity.

Fields:
- `id` UUID PK
- `name` string
- `email` string UNIQUE NOT NULL
- `password_hash` string NOT NULL
- `role` ENUM(`FARMER`, `CORPORATE`, `ADMIN`)
- `created_at`
- `updated_at`

Rules:
- email unique
- role comes from backend/system, not a farmer-selected login option

# 2. farms

Fields:
- `id` UUID PK
- `user_id` UUID FK → users.id
- `digital_farm_id` string UNIQUE
- `name`
- `lat`
- `lng`
- `land_area_ha`
- `commodity`
- `status` ENUM(`REGISTERED`, `DATA_COLLECTION`, `ASSESSED`, `CARBON_CANDIDATE`)
- `created_at`
- `updated_at`

Relationships:
- user 1:N farms
- farm 1:N seasons
- farm 1:N insurance
- farm 1:N scores

Ownership:
`farms.user_id` defines farmer ownership.

# 3. farm_seasons

Fields:
- `id` UUID PK
- `farm_id` FK → farms.id
- `season_label`
- `start_date`
- `end_date`
- `sequence_number`

Relationship:
farm 1:N farm_seasons.

# 4. farm_data

Fields:
- `id` UUID PK
- `farm_season_id` FK → farm_seasons.id
- `yield_kg`
- `water_usage`
- `fertilizer_usage`
- `pesticide_usage`
- `waste_management_practice`
- `soil_practice`
- `energy_usage`
- `low_carbon_practice` boolean
- `status` ENUM(`SELF_REPORTED`, `REVIEW`, `VERIFIED`, `REJECTED`)
- `submitted_at`

Relationship:
farm_season 1:N farm_data.

# 5. evidence

Fields:
- `id` UUID PK
- `farm_data_id` FK → farm_data.id
- `type` ENUM including `PHOTO`, `GPS`, `DOCUMENT` and other PRD-supported values
- evidence reference/metadata
- created timestamp

Relationship:
farm_data 1:N evidence.

# 6. insurance

Fields required by PRD concept:
- farm reference
- insurance partner
- policy status
- relevant policy/coverage information
- timestamps

Status:
`PENDING → ACTIVE → EXPIRED`

The platform does not underwrite policies.

# 7. scores

Use a score record capable of representing:
- farm
- score type / FSS or CRS
- value
- provisional/verified context where applicable
- breakdown
- calculation timestamp

The exact physical schema can be chosen during implementation, but it must support:
- FSS
- CRS
- breakdown
- historical records where required
- recalculation after verified data

# 8. rewards

Fields:
- `id` UUID PK
- `user_id` FK → users.id
- event/type
- points
- total points snapshot
- tier snapshot
- created timestamp

Relationship:
user 1:N rewards.

Reward events include:
- farm data submission
- verification
- FSS improvement
- recorded sustainable practices
- milestone bonus

MVP rewards are non-financial.

# 9. carbon_projects

Fields:
- `id` UUID PK
- `name`
- `status` ENUM(`CANDIDATE`, `ASSESSMENT`, `AGGREGATING`, `VERIFICATION`, `REGISTRATION`, `ISSUANCE`, `TRADING`)
- `region`
- `commodity_focus`
- `total_farms`
- `total_area_ha`
- `created_at`

MVP should focus on candidate/assessment/aggregating.

# 10. project_farms

Fields:
- `carbon_project_id` FK
- `farm_id` FK
- `added_at`

Constraint:
- unique `(carbon_project_id, farm_id)`

Relationship:
carbon_project 1:N project_farms N:1 farms.

# 11. corporates

Fields:
- `id` UUID PK
- `user_id` FK → users.id
- `company_name`
- `industry`
- `region`
- `status`

Relationship:
user 1:1 corporate.

# 12. consents

Fields:
- `id` UUID PK
- `user_id` FK
- `consent_version`
- `purpose`
- `granted_at`
- `revoked_at`

Relationship:
user 1:N consents.

# 13. audit_logs

Fields:
- `id` UUID PK
- `actor_user_id` FK → users.id
- `action`
- `target_entity`
- `target_id`
- `metadata` JSON
- `created_at`

Use for sensitive actions including:
- data verification/rejection
- project lifecycle changes
- other administrative decisions

# Indexing recommendations

At minimum:
- users.email UNIQUE
- farms.user_id
- farms.digital_farm_id UNIQUE
- farm_seasons.farm_id
- farm_data.farm_season_id
- farm_data.status
- evidence.farm_data_id
- insurance.farm_id
- scores.farm_id
- rewards.user_id
- project_farms.project_id
- project_farms.farm_id
- audit_logs.actor_user_id
- audit_logs.target_entity + target_id

# Data ownership

Farmer:
- owns/accesses own farm data

Admin:
- can review/govern data

Corporate:
- sees aggregate/non-individual project information

Do not expose individual farmer identity through corporate aggregate endpoints.

# Migration rules

Every schema change must:
1. be represented by a migration
2. preserve existing data where applicable
3. update `docs/ERD.md` if relationships change
4. update API DTOs if public contracts change
5. update seed data/tests where applicable

# Prisma → Supabase migration workflow

- `pnpm prisma:generate` — regenerate the Prisma client (also runs on prebuild/prestart).
- `pnpm prisma:migrate -- --name <name>` — `prisma migrate dev`, used only when authoring a new migration. Requires:
  - `DIRECT_URL` (session-mode, port 5432) — never the transaction pooler (6543).
  - `SHADOW_DATABASE_URL` pointing at a throwaway database (e.g. `c_carbon_shadow`) pre-created on the same cluster; Supabase cannot create databases on the fly, and Prisma resets the shadow DB on every run.
- `pnpm prisma:deploy` — `prisma migrate deploy`, applies committed migrations to the remote database (used for anything that is not local authoring; does not need a shadow database).

Shadow databases never hold real data and are not visible in the Supabase dashboard — that is expected.
