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
- [ ] Configure TypeScript strict mode
- [ ] Configure environment files
- [ ] Configure PostgreSQL connection
- [ ] Add design tokens/theme
- [ ] Add base UI primitives
- [ ] Add database migration tooling

## Phase 1 — Authentication

- [ ] User schema
- [ ] Register API
- [ ] Login API
- [ ] JWT strategy
- [ ] Role guard
- [ ] Secure mobile token storage
- [ ] Login screen
- [ ] Register screen
- [ ] Auth redirect

## Phase 2 — Farm

- [ ] Farm schema
- [ ] Farm API
- [ ] Ownership authorization
- [ ] Farm List
- [ ] Farm Detail
- [ ] Register Farm
- [ ] Digital Farm ID generation

## Phase 3 — Insurance

- [ ] Insurance schema
- [ ] Insurance API
- [ ] Insurance status UI
- [ ] Pending/active/expired states

## Phase 4 — Farm Data

- [ ] Farm season schema
- [ ] Farm data schema
- [ ] Evidence schema/storage strategy
- [ ] Submit API
- [ ] History API
- [ ] Submit screen
- [ ] History screen
- [ ] Verification states

## Phase 5 — Scoring

- [ ] FSS calculation service
- [ ] Normalization abstraction
- [ ] FSS breakdown
- [ ] Provisional score
- [ ] Verified score
- [ ] Score API
- [ ] Score screen
- [ ] Unit tests

## Phase 6 — Rewards

- [ ] Reward event service
- [ ] Tier calculation
- [ ] Reward persistence
- [ ] Rewards API
- [ ] Rewards screen
- [ ] Unit tests

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
