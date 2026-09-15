# Technical Architecture

## Repository

```text
farm-risk-carbon-platform/
├── AGENTS.md
├── TASKS.md
├── README.md
├── package.json
├── .gitignore
├── docs/
├── mobile/
└── backend/
```

The PRD explicitly recommends a simple monorepo and avoiding over-engineering/shared packages unless needed.

# Mobile

```text
mobile/
├── app/
├── components/
├── features/
├── services/
├── store/
├── lib/
├── types/
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

## `app/`

Expo Router route tree.

Responsibilities:
- route definitions
- layouts
- navigation
- route guards/redirect composition where appropriate

Do not place domain business logic here.

## `components/`

Generic reusable UI:
- Button
- Card
- Badge
- Input
- EmptyState
- ErrorState
- Skeleton
- ScoreDisplay
- Section
- ListItem

Components should be reusable across domains.

## `features/`

Domain-specific code:

```text
features/
├── auth/
├── farms/
├── insurance/
├── farm-data/
├── scoring/
├── rewards/
├── carbon/
├── corporate/
└── admin/
```

A feature may contain:
- components
- hooks
- validation
- view models
- domain-specific formatting

## `services/`

API client and domain API functions.

Suggested:

```text
services/
├── api-client.ts
├── auth.service.ts
├── farms.service.ts
├── insurance.service.ts
├── farm-data.service.ts
├── scoring.service.ts
├── rewards.service.ts
├── carbon.service.ts
└── corporate.service.ts
```

## `store/`

Global state only:
- session
- authenticated user
- profile

Do not put all server data into a global store.

## `lib/`

Utilities:
- theme
- formatters
- constants
- date/number helpers
- storage helpers

## `types/`

Shared TypeScript contracts.

## `assets/`

Images, icons, fonts.

# Backend

Recommended NestJS structure:

```text
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── farms/
│   │   ├── farm-data/
│   │   ├── insurance/
│   │   ├── scoring/
│   │   ├── rewards/
│   │   ├── carbon/
│   │   ├── corporate/
│   │   └── admin/
│   └── config/
├── .env.example
├── package.json
└── tsconfig.json
```

The original PRD presents a layered backend structure using routes/controllers/services/repositories/models/middlewares/validators/config/utils. In NestJS, map these responsibilities to modules/controllers/services/guards/pipes/entities/repositories/common utilities rather than mechanically copying a non-Nest framework folder layout.

## Common

Potential shared concerns:
- auth guards
- role guards
- ownership helpers
- exception filters
- request logging
- pagination DTOs
- API response helpers

Do not turn `common/` into a dumping ground.

# Dependency direction

```text
Route/Screen
    ↓
Feature UI / Controller
    ↓
Service
    ↓
Repository / API client
    ↓
Database / External API
```

Business logic should not depend on React components.

# Authentication

JWT bearer:

```http
Authorization: Bearer <token>
```

Login response must identify the backend-determined role.

Mobile stores tokens securely.

# Authorization

Backend checks:
- authenticated user
- role
- resource ownership

Example:
`GET /farms/:id` must verify that the requested farm belongs to the current farmer, unless the caller has an authorized administrative role.

# Environment

Use:
- `.env`
- `.env.local` where appropriate
- `.env.example`

Never commit secrets.

Private backend credentials stay on the backend.

# Integration strategy

Build vertically through the golden path instead of building every screen disconnected from backend behavior.

Preferred sequence:
1. auth end-to-end
2. farm end-to-end
3. farm data end-to-end
4. scoring
5. rewards
6. CRS
7. project aggregation
8. corporate read path
