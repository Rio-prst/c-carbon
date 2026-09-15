# UI Specification — Agent Implementation Guide

This file translates the PRD screen requirements into implementation intent.

The original PRD remains the source of truth for exact acceptance criteria.

## Global screen rules

Every data screen:
- safe-area aware
- consistent 20 px horizontal page padding
- uses the design token system
- has loading skeleton
- has error + retry
- has empty state where applicable
- avoids nested card overload
- keeps primary action visually obvious

## AUTH-01 — Login

Purpose:
Authenticate a registered user. Role comes from backend.

UI:
- app identity
- email input
- password input
- primary Login action
- registration CTA
- inline validation
- submission loading state
- friendly API error

Rules:
- password minimum 8 characters
- do not ask user to select role
- store token securely
- redirect based on backend role

## FARM-01 — Farm List

Purpose:
Show only farms owned by current farmer.

Content:
- page title
- farm list
- farm name
- location
- commodity
- status
- FAB/add action

Empty:
"Daftarkan Farm Pertama Anda"

Interaction:
- tap farm → detail
- add → register farm
- pull to refresh

P1:
search/filter.

## FARM-02 — Farm Detail

Header:
- farm name
- location
- land area
- commodity
- Digital Farm ID

Primary information:
- insurance status
- FSS
- CRS
- farm data history shortcut

Rules:
- if insurance is not ACTIVE, show a useful warning and link to insurance
- if no farm data exists, show "Belum tersedia" for FSS, not zero
- status must reflect current backend data

## FARM-03 — Register Farm

Fields:
- farm name
- GPS/location
- land area
- commodity
- current planting season (optional)

Validation:
- name required
- valid lat/long
- land area > 0
- commodity required

Success:
- backend generates unique Digital Farm ID
- farm status = REGISTERED
- navigate to Farm Detail

## INS-01 — Insurance

Purpose:
Show policy/coverage information.

MVP:
read-only farmer experience.

Status:
- PENDING
- ACTIVE
- EXPIRED

Do not imply that the platform itself underwrites insurance.

## DATA-01 — Submit Farm Data

Collect PRD-defined farm data such as:
- yield
- water usage
- fertilizer usage
- pesticide usage
- waste management
- soil practice
- energy usage
- low-carbon practice

Evidence:
- photo/GPS/document where applicable

States:
Initial → Editing → Validation Error → Submitting → Success
Submitting → Submission Error

Do not lose the form draft on transient network errors.

## DATA-02 — Farm Data History

Show:
- season
- submission date
- status
- key summary
- evidence indicator

Statuses:
- SELF_REPORTED
- REVIEW
- VERIFIED
- REJECTED

Rejected records must explain the reason when available.

## SCORE-01 — Farm Sustainability Score

Show:
- FSS value 0–100
- provisional/verified state
- breakdown
- short interpretation
- relevant improvement/action context

FSS weighting from PRD:
- Productivity 20%
- Input Efficiency 15%
- Water Efficiency 15%
- Fertilizer Management 10%
- Waste Management 10%
- Soil Conservation 10%
- Energy 5%
- Risk History 5%
- Data Consistency 5%
- Low-Carbon Practice 5%

Do not present FSS as a carbon credit.

## REWARD-01 — Rewards

Show:
- total points
- tier
- chronological reward history

Prototype tiers:
- 0–399 Basic
- 400–699 Silver
- 700–899 Gold
- 900+ Carbon Ready

Rewards are non-financial gamification in MVP.

Avoid game-like visual treatment.

## CARBON-01 — Carbon Readiness

Show:
- CRS 0–100
- explanation
- readiness breakdown
- next requirements/actions

Prototype weighting:
- Eligible Farming Practice 40%
- Data Completeness 25%
- Baseline Availability 15%
- Verification Readiness 10%
- Aggregation Suitability 10%

CRS is an internal indicator, not carbon credit.

## CARBON-02 — Candidate Project / Project List

Farmer-facing project information should not expose restricted corporate/admin data.

Candidate project lifecycle in MVP:
- CANDIDATE
- ASSESSMENT
- AGGREGATING

## CORP-01 — Corporate Overview

Show aggregate:
- number of projects
- farms
- total area
- relevant commodities
- readiness/project indicators

Do not reveal individual farmer identity.

## CORP-02 — Project List

Show:
- project name
- lifecycle status
- region
- commodity focus
- aggregate scale

MVP visible lifecycle:
CANDIDATE / ASSESSMENT / AGGREGATING

P1:
filters.

## CORP-03 — Project Detail

Show:
- project information
- farm count
- area
- commodity
- aggregate indicators
- optional region map (P2)

Include a clear distinction between candidate project data and issued carbon credits.

No purchasing or transaction UI in MVP.

## ADMIN-01 — Data Review

Show:
- review queue
- farm data
- evidence
- Verify action
- Reject action
- rejection reason

Reject requires reason.

Verify/reject must update status and create audit log.

Verified data triggers relevant FSS/CRS recalculation.

## ADMIN-02 — Carbon Project Management

Show:
- project list
- create project form
- eligible-farm filter
- aggregation action
- lifecycle transition action

MVP lifecycle:
CANDIDATE → ASSESSMENT → AGGREGATING

Do not allow arbitrary backwards transitions without audit trail.

# Screen state matrix

| Screen type | Loading | Empty | Error | Form validation |
|---|---|---|---|---|
| List | skeleton | yes | retry | no |
| Detail | skeleton | usually no | retry | no |
| Form | button progress | no | retry | yes |
| Score | skeleton | contextual | retry | no |
| Project | skeleton | contextual | retry | no |
| Admin queue | skeleton | yes | retry | yes for reject |

# Component composition rule

Prefer:

```text
Screen
 ├── Header
 ├── Section
 │    └── Content
 ├── Section
 │    └── Content
 └── Primary action
```

over:

```text
Screen
 ├── Card
 │    ├── Card
 │    │    └── Card
 │    └── Card
 └── Card
```
