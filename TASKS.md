# Development Tasks

Agent should execute tasks in order unless a dependency requires otherwise.

Status:
- `[ ]` not started
- `[~]` in progress
- `[x]` done

## Phase 0 — Foundation

- [x] Initialize monorepo
- [x] Initialize Expo mobile app
- [x] Initialize NestJS backend
- [x] Configure TypeScript strict mode
- [x] Configure environment files
- [x] Configure PostgreSQL connection
- [x] Add design tokens/theme
- [x] Add base UI primitives
- [x] Add database migration tooling

## Phase 1 — Authentication

- [x] User schema
- [x] Register API
- [x] Login API
- [x] JWT strategy
- [x] Role guard
- [x] Secure mobile token storage
- [x] Login screen
- [x] Register screen
- [x] Auth redirect

## Phase 2 — Farm

- [x] Farm schema
- [x] Farm API
- [x] Ownership authorization
- [x] Farm List
- [x] Farm Detail
- [x] Register Farm
- [x] Digital Farm ID generation

## Phase 3 — Insurance

- [x] Insurance schema
- [x] Insurance API
- [x] Insurance status UI
- [x] Pending/active/expired states

## Phase 4 — Farm Data

- [x] Farm season schema
- [x] Farm data schema
- [~] Evidence schema/storage strategy (schema only, no upload storage yet)
- [x] Submit API
- [x] History API
- [x] Submit screen
- [x] History screen
- [~] Verification states (farmer view only, admin review not built)

## Phase 5 — Scoring

- [x] FSS calculation service
- [x] Normalization abstraction
- [x] FSS breakdown
- [x] Provisional score
- [ ] Verified score (blocked on admin review)
- [x] Score API
- [x] Score screen
- [x] Unit tests

## Phase 6 — Rewards

- [x] Reward event service
- [x] Tier calculation
- [x] Reward persistence
- [x] Rewards API
- [x] Rewards screen
- [x] Unit tests
- [x] Award reward on data submission

## Phase 6.5 — Admin (P0, not yet started)

Required for `VERIFIED` status and non-provisional scores.

- [ ] Admin data review list
- [ ] Verify/reject action
- [ ] Evidence review
- [ ] Audit logging

## Phase 7 — Carbon Readiness

- [ ] CRS calculation service
- [ ] CRS API
- [ ] CRS screen
- [ ] Eligibility explanation
- [ ] Unit tests

## Phase 8 — Carbon Project

- [ ] Carbon project schema
- [ ] Project-farm schema
- [ ] Eligibility filter
- [ ] Aggregation service
- [ ] Candidate project creation
- [ ] Farmer project view
- [ ] Admin project management

## Phase 9 — Corporate

- [ ] Corporate profile schema
- [ ] Aggregate project API
- [ ] Corporate overview
- [ ] Project list
- [ ] Project detail
- [ ] Privacy checks

## Phase 10 — Integration

- [ ] Golden path E2E
- [ ] Seed/demo data
- [ ] Loading states
- [ ] Empty states
- [ ] Error/retry states
- [ ] Authorization regression tests

## Phase 11 — Polish

- [ ] Visual consistency pass
- [ ] Typography pass
- [ ] Spacing pass
- [ ] Accessibility pass
- [ ] Performance pass
- [ ] Demo flow pass

## Rule for agent execution

Pick the next unchecked task whose dependencies are satisfied.

Implement only that task.

Do not mark a task done until its relevant acceptance criteria and tests pass.
