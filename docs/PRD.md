# Product Requirements — PRD Summary

## Source

Based on `Farm_Risk_Carbon_Platform_PRD_v2.pdf`.

This file is an agent-oriented summary, not a replacement for the original PDF.

## Product vision

Farm Risk & Carbon Platform connects three value layers for smallholder farmers:

1. **Risk protection** — insurance status
2. **Performance & sustainability** — farm data and Farm Sustainability Score
3. **Carbon pathway** — Carbon Readiness Score, aggregation, and candidate carbon projects

The central product asset is a longitudinal farm track record.

## Core chain

Farmer
→ Digital Farm ID
→ Insurance
→ Farm Data
→ Farm Sustainability Score
→ Rewards
→ Carbon Readiness
→ Aggregation
→ Candidate Carbon Project
→ Corporate Buyer view
→ potential farmer benefit

The MVP stops at candidate-project/corporate evaluation. Verification, registry, issuance, trading, and real revenue distribution are conceptual/future.

## Roles

### FARMER
Can:
- register/login
- register farms
- view own farms
- view insurance status
- submit farm data and evidence
- view farm data history
- view FSS
- view rewards
- view CRS
- view candidate carbon projects where applicable
- manage consent/profile

### CORPORATE
Can:
- view aggregate project overview
- view candidate project list
- view project detail and aggregate impact
- evaluate project scale and readiness

Corporate MVP must not expose individual farmer identity.

### ADMIN
Can:
- review farm data/evidence
- verify or reject data
- manage candidate carbon projects
- aggregate eligible farms
- change permitted project lifecycle states
- perform sensitive actions that are recorded in audit logs

## Information architecture

### Farmer mobile
Authentication
→ Home
→ Farms
→ Insurance
→ Farm Data
→ Farm Score
→ Rewards
→ Carbon Readiness
→ Carbon Projects
→ Notifications
→ Profile

Notifications and some impact functionality are lower priority and are not part of the golden path.

### Corporate
Overview
→ Projects
→ Project Detail
→ Farmer/Area Impact
→ Profile

### Admin
Data Review
→ Farmer/Farm
→ Insurance Status
→ Carbon Projects
→ Audit Logs

## P0 feature set

- Registration & Login
- Farm Registration & Digital Farm ID
- Insurance status, read-only
- Submit Farm Data + Evidence
- Farm Data History
- Farm Sustainability Score
- Rewards
- Carbon Readiness Score
- Aggregation & Candidate Project
- Corporate Overview & Project Detail
- Admin Data Review
- Admin Carbon Project Management

## P1/P2 features

P1/P2:
- insurance claim simulation
- notifications
- corporate farmer/area impact
- advanced list filters
- score history chart
- project map
- multi-language
- real insurance/carbon integrations

These must not become accidental MVP dependencies.

## Product principles

The interface should communicate:
- trust
- clarity
- progress
- evidence
- practical action
- long-term value

Carbon must be presented as a readiness/project pathway, not as an already-issued financial asset.

## Important scoring distinction

### FSS
Answers:
> How sustainable / well-performing is this farm generally?

### CRS
Answers:
> How ready is this farm/data to be evaluated as a candidate carbon project?

FSS ≠ Carbon Credit.
CRS ≠ Carbon Credit.

## Insurance boundary

The platform is not the insurer.

Insurance partner handles underwriting and policy issuance.

MVP policy status:
`PENDING → ACTIVE → EXPIRED`

Status may be synchronized from partner or manually managed by Admin in MVP.

## Golden path

1. Register
2. Create Farm
3. Insurance Active
4. Submit Farm Data
5. Admin verification / scoring path
6. FSS
7. Reward
8. CRS
9. Eligible aggregation
10. Candidate Carbon Project
11. Corporate Dashboard

## Screen contract

Each screen should be designed around:
- purpose
- role
- navigation
- components
- data
- API
- state
- validation
- user actions
- business rules
- acceptance criteria

See `docs/UI-SPEC.md` for the implementation-oriented version.
