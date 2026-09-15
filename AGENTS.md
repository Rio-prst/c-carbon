# AGENTS.md — Engineering Rules

## Mission

Build the Farm Risk & Carbon Platform competition MVP according to the PRD and the documentation in `docs/`.

The agent must optimize for:
1. correctness against the PRD
2. coherent UX
3. maintainable code
4. fast iteration
5. demo reliability

## Required stack

### Mobile
- React Native
- Expo
- TypeScript
- Expo Router
- Prefer Expo APIs and React Native core components
- Avoid ejecting from Expo
- Avoid native dependencies unless genuinely necessary

### Backend
- NestJS
- Node.js
- TypeScript
- REST API
- PostgreSQL
- ORM/data layer may be selected during setup, but keep the persistence model aligned with `docs/DATABASE.md`

## Architecture rules

### Mobile
- `app/` is routing and screen composition.
- `features/` owns domain-specific UI and logic.
- `components/` owns reusable generic UI.
- `services/` owns HTTP/API calls.
- `store/` owns global state such as auth/session.
- `lib/` owns utilities, constants, formatters.
- `types/` owns shared TypeScript types.
- Screens should stay thin.

Do not put:
- scoring algorithms in screens
- API calls directly scattered across components
- large business rules inside JSX
- duplicated loading/error handling everywhere when a reusable pattern is appropriate

### Backend
Use a NestJS module/domain structure:
- auth
- users
- farms
- farm-data
- insurance
- scoring
- rewards
- carbon
- corporate
- admin

Within a domain, separate:
- controller
- service
- persistence/repository layer
- DTO/validation
- entity/model where applicable

Controllers handle transport. Services handle business logic. Persistence handles database access.

## TypeScript

- Use strict TypeScript.
- Avoid `any`.
- Prefer explicit domain types.
- Do not duplicate API response types in multiple places.
- Keep enums/state values consistent with the backend contract.

## Product rules

Never invent product behavior just to make a screen look complete.

If a requirement is:
- `TBD`: leave it configurable or isolated.
- `Assumption`: document the assumption.
- `Recommended for MVP`: implement only if needed for the golden path.
- Future roadmap: do not implement unless explicitly requested.

## Authorization

Authorization is a backend responsibility.

A farmer must never access another farmer's farm or farm data merely because the UI hides it.

Every protected resource must perform role and/or ownership checks at the API boundary.

Corporate users must receive aggregate project information and must not receive individual farmer identity in MVP corporate views.

Sensitive admin actions must be auditable.

## UI rules

Read:
- `docs/DESIGN-SYSTEM.md`
- `docs/UI-SPEC.md`

Do not independently invent visual language per screen.

Avoid:
- excessive gradients
- excessive cards
- excessive pills
- giant meaningless metrics
- decorative charts
- random icon usage
- crypto/Web3 visual tropes for carbon
- generic AI-dashboard patterns
- unnecessary animations

Every component should have a product reason.

## State handling

Every data-driven screen must account for:
- loading
- success
- empty where applicable
- error + retry

Loading should prefer skeleton/shape placeholders over a full-screen spinner.

Forms should account for:
- initial
- editing
- validation error
- submitting
- success
- submission error

## API

Do not create ad-hoc endpoints because they are convenient for a screen.

Read `docs/API.md` before adding or changing an endpoint.

Keep API naming consistent and return predictable response shapes.

## Database

Read `docs/DATABASE.md` and `docs/ERD.md` before changing schema.

Use UUID primary keys where specified by the PRD.

Do not expose database entities directly as public API contracts if doing so leaks internal fields.

## Development order

Follow:

Product flow
→ Database
→ Repository setup
→ Authentication
→ Farm
→ Insurance
→ Farm Data
→ Scoring
→ Rewards
→ Carbon Readiness
→ Carbon Project
→ Corporate
→ Integration
→ Testing
→ UI polish
→ Demo

## Agent workflow

For each task:
1. Read this file.
2. Read the relevant docs.
3. Inspect existing code before creating new abstractions.
4. Implement only the requested task.
5. Run typecheck/lint/tests relevant to the changed area.
6. Fix regressions.
7. Verify loading/empty/error/validation states where applicable.
8. Verify authorization for protected backend resources.
9. Summarize what changed and any remaining assumptions.

Do not silently implement future tasks.

## Definition of Done

A feature is Done only when applicable:
- UI matches the product specification
- API is connected
- validation works
- loading state works
- empty state works
- error state + retry works
- authorization/ownership checks work
- database persistence works
- tests pass
- acceptance criteria are satisfied
