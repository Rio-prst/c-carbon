# Farm Risk & Carbon Platform

Development knowledge base for the **Farm Risk & Carbon Platform** competition MVP.

This repository is a simple monorepo with:
- `mobile/` — React Native + Expo + TypeScript + Expo Router
- `backend/` — NestJS + TypeScript + REST API
- `docs/` — product, design, architecture, database, API, business rules, scope, and development guidance

## Product in one sentence

The platform builds a longitudinal **digital farm track record** that turns farm activities and performance into economic value through:

**Digital Farm ID → Insurance → Farm Data → Farm Sustainability Score → Rewards → Carbon Readiness → Aggregation → Candidate Carbon Project → Corporate View**

The core asset is the longitudinal farm track record. It connects farmer, insurance, sustainability, carbon, and corporate use cases.

## Documentation hierarchy

When implementing anything, read the relevant documents in this order:

1. `AGENTS.md` — global engineering rules
2. `docs/PRD.md` — product requirements and source-of-truth summary
3. `docs/MVP-SCOPE.md` — what is and is not in the competition MVP
4. `docs/DESIGN-SYSTEM.md` — visual language and UI implementation rules
5. `docs/UI-SPEC.md` — screen-level UI intent
6. `docs/BUSINESS-RULES.md` — domain rules and state transitions
7. `docs/DATABASE.md` + `docs/ERD.md` — persistence model
8. `docs/API.md` — frontend/backend contract
9. `docs/ARCHITECTURE.md` — code organization
10. `TASKS.md` + `docs/DEVELOPMENT.md` — implementation order and workflow

If two documents appear to conflict, do not silently choose one. Stop and inspect the PRD/source requirement and document the ambiguity.

## Source of truth

`Farm_Risk_Carbon_Platform_PRD_v2.pdf` is the product source of truth for this project.

These Markdown files turn the PRD into agent-friendly development knowledge. They must not introduce product features that are outside the PRD without marking them as **Recommendation**, **Assumption**, or **TBD**.

## MVP golden path

Register → Create Farm → Insurance Active → Submit Farm Data → Score → Reward → Carbon Readiness → Candidate Project → Corporate Dashboard

## MVP roles

- `FARMER`
- `CORPORATE`
- `ADMIN`

## Important product boundaries

- The platform is **not** an insurance company.
- Real underwriting and policy issuance belong to a licensed insurance partner.
- FSS and CRS are internal platform indicators; they are **not carbon credits**.
- MVP corporate views show aggregate project information, not individual farmer identities.
- Real carbon purchasing, registry issuance, MRV, and real revenue distribution are future roadmap items.
- Do not present conceptual future functionality as already available.

## Development philosophy

Prefer the smallest implementation that satisfies the PRD.

Do not add:
- unnecessary shared packages
- premature abstractions
- excessive state-management libraries
- native modules when an Expo API/core React Native solution is enough
- speculative features
- decorative UI without product purpose

The app should feel like a coherent product designed by a product team, not a collection of AI-generated screens.
