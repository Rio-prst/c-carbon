# Development Guide

## Local setup

Required:
- Node.js LTS
- npm/pnpm/yarn according to chosen repo standard
- Expo tooling
- PostgreSQL

## Environment

Create:

```text
backend/.env
backend/.env.example
```

Never commit secrets.

Example variables:

```env
DATABASE_URL=
JWT_SECRET=
PORT=3000
```

Mobile should use a configurable backend base URL appropriate for emulator/device development.

## Install

Install dependencies separately for:
- root
- mobile
- backend

Do not add packages unless they solve a real requirement.

## Running

Typical development:
- backend: NestJS development server
- mobile: Expo development server
- PostgreSQL: local/dev database

Exact scripts are defined by the generated project package files.

## Quality checks

Before completing a feature:
- TypeScript typecheck
- lint
- unit tests
- integration tests where applicable
- E2E for golden path milestones

## Database workflow

Schema change:
1. update model/entity
2. create migration
3. update seed if needed
4. run migration
5. test rollback/upgrade behavior if relevant
6. update `docs/DATABASE.md` and `docs/ERD.md`

## Feature workflow

For each feature:

```text
Requirement
↓
Business rule
↓
Database
↓
API
↓
Service logic
↓
Mobile service
↓
Feature UI
↓
State handling
↓
Tests
```

## Demo data

Seed data must be clearly labeled as demo/illustrative.

Corporate project numbers must remain internally consistent across list/detail/overview.

Do not seed fake issued carbon credits.

## Git

Recommended small commits:
- `feat(auth): ...`
- `feat(farms): ...`
- `feat(scoring): ...`
- `fix(api): ...`
- `test(scoring): ...`
- `refactor(ui): ...`

Avoid giant commits covering unrelated domains.

## Agent prompt

Recommended recurring prompt:

> Read `AGENTS.md` and the relevant docs under `docs/`. Pick the next unchecked task from `TASKS.md` whose dependencies are satisfied. Implement only that task. Do not implement future tasks. Reuse existing architecture and design tokens. Run relevant typecheck/lint/tests. Fix failures. Update `TASKS.md` only after the task is genuinely complete. Summarize changes, tests, and any assumptions/TBDs.
